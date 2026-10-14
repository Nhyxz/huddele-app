import { OperationalAction, Huddle } from '../models';
import { IActionRepository } from '../repositories/interfaces/IActionRepository';
import { IHuddleRepository } from '../repositories/interfaces/IHuddleRepository';
import { IAuditRepository } from '../repositories/interfaces/IAuditRepository';

export interface TransferRequest {
  actionIds: string[];
  sourceHuddleId: string;
  destinationHuddleId: string;
  transferNote?: string;
  performedBy: string;
}

export interface TransferResult {
  success: boolean;
  transferredCount: number;
  newActionIds: string[];
  skippedDuplicateIds: string[];
  error?: string;
}

export class TransferService {
  constructor(
    private actionRepo: IActionRepository,
    private huddleRepo: IHuddleRepository,
    private auditRepo: IAuditRepository
  ) {}

  /**
   * Identifies all actions in a huddle that are candidates for transfer
   * (i.e. not completed, not cancelled, and not already transferred)
   */
  async getTransferableActions(huddleId: string): Promise<OperationalAction[]> {
    const actions = await this.actionRepo.getByHuddleId(huddleId);
    return actions.filter(
      action => 
        action.status !== 'Completed' && 
        action.status !== 'Cancelled' && 
        action.status !== 'Transferred' &&
        !action.transferred
    );
  }

  /**
   * Executes the transfer of selected actions into a target huddle
   */
  async transferActions(request: TransferRequest): Promise<TransferResult> {
    const { actionIds, sourceHuddleId, destinationHuddleId, transferNote, performedBy } = request;

    if (!actionIds || actionIds.length === 0) {
      return { success: false, transferredCount: 0, newActionIds: [], skippedDuplicateIds: [], error: 'No actions selected for transfer.' };
    }

    if (!destinationHuddleId) {
      return { success: false, transferredCount: 0, newActionIds: [], skippedDuplicateIds: [], error: 'Destination huddle is required.' };
    }

    if (sourceHuddleId === destinationHuddleId) {
      return { success: false, transferredCount: 0, newActionIds: [], skippedDuplicateIds: [], error: 'Destination huddle cannot be the current huddle.' };
    }

    const destinationHuddle = await this.huddleRepo.getById(destinationHuddleId);
    if (!destinationHuddle) {
      return { success: false, transferredCount: 0, newActionIds: [], skippedDuplicateIds: [], error: 'Destination huddle not found.' };
    }

    // Fetch existing actions in destination huddle to check for duplicate transfers
    const destActions = await this.actionRepo.getByHuddleId(destinationHuddleId);

    const newActionIds: string[] = [];
    const skippedDuplicateIds: string[] = [];

    for (const actionId of actionIds) {
      const originalAction = await this.actionRepo.getById(actionId);
      if (!originalAction) continue;

      // Prevent duplicate transfer into the same destination huddle:
      // If destination already has an action whose sourceActionId matches this actionId, or vice versa
      const alreadyTransferred = destActions.some(
        da => da.sourceActionId === originalAction.id || (originalAction.sourceActionId && da.sourceActionId === originalAction.sourceActionId)
      );

      if (alreadyTransferred) {
        skippedDuplicateIds.push(originalAction.id);
        continue;
      }

      const now = new Date().toISOString();

      // 1. Mark original action as Transferred and record metadata
      await this.actionRepo.update(originalAction.id, {
        status: 'Transferred',
        transferred: true,
        transferredToHuddleId: destinationHuddleId,
        transferNote: transferNote || `Transferred to ${destinationHuddle.time} Huddle (${destinationHuddle.date})`,
        updatedAt: now,
      });

      // 2. Create the child action in the destination huddle
      const newAction = await this.actionRepo.create({
        huddleId: destinationHuddleId,
        sourceActionId: originalAction.id,
        initials: originalAction.initials,
        location: originalAction.location,
        losHours: originalAction.losHours,
        losCategory: originalAction.losCategory,
        description: originalAction.description,
        holder: originalAction.holder,
        priority: originalAction.priority,
        status: 'In Progress', // Active in the new huddle
        comments: originalAction.comments ? `${originalAction.comments} [Handover: ${transferNote || 'Transferred from previous huddle'}]` : (transferNote || 'Transferred from previous huddle'),
        targetReviewTime: destinationHuddle.time,
        escalationRequired: originalAction.escalationRequired,
        escalatedTo: originalAction.escalatedTo,
        escalationTime: originalAction.escalationTime,
        escalationResponse: originalAction.escalationResponse,
        transferred: false,
        transferredFromHuddleId: sourceHuddleId,
        transferNote,
      });

      newActionIds.push(newAction.id);

      // 3. Log audit event
      await this.auditRepo.log({
        entityType: 'Action',
        entityId: originalAction.id,
        eventType: 'Transferred',
        summary: `Action '${originalAction.description}' (${originalAction.initials}) transferred to ${destinationHuddle.time} Huddle`,
        previousValue: sourceHuddleId,
        newValue: destinationHuddleId,
        performedBy,
        reason: transferNote || 'Handover into subsequent operational huddle',
      });
    }

    return {
      success: true,
      transferredCount: newActionIds.length,
      newActionIds,
      skippedDuplicateIds,
    };
  }
}
