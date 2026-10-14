import { describe, it, expect, beforeEach } from 'vitest';
import { TransferService } from '../services/TransferService';
import { MetricsService } from '../services/MetricsService';
import { LocalStorageActionRepository } from '../repositories/localStorage/LocalStorageActionRepository';
import { LocalStorageHuddleRepository } from '../repositories/localStorage/LocalStorageHuddleRepository';
import { LocalStorageAuditRepository } from '../repositories/localStorage/LocalStorageAuditRepository';
import { importPrototypeData } from '../repositories';
import { OperationalAction, Huddle, DepartmentSnapshot } from '../models';

// In-memory mock localStorage for testing environment
class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] || null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

// Attach mock localStorage to global if needed
if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.getItem) {
  const mockStorage = new MockLocalStorage();
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
}

describe('Core Logic & Transfer Service Tests', () => {
  let actionRepo: LocalStorageActionRepository;
  let huddleRepo: LocalStorageHuddleRepository;
  let auditRepo: LocalStorageAuditRepository;
  let transferService: TransferService;

  beforeEach(() => {
    localStorage.clear();
    actionRepo = new LocalStorageActionRepository();
    huddleRepo = new LocalStorageHuddleRepository();
    auditRepo = new LocalStorageAuditRepository();
    transferService = new TransferService(actionRepo, huddleRepo, auditRepo);
  });

  it('creates, edits, and completes an action successfully', async () => {
    // 1. Create
    const created = await actionRepo.create({
      huddleId: 'hud-test-1',
      initials: 'TX',
      location: 'Resus 1',
      losHours: 2.5,
      losCategory: '2 - 3h',
      description: 'Initial bloods urgently required',
      holder: 'ED Nurse',
      priority: 'High',
      status: 'New',
      comments: 'Drawn and sent to lab',
      escalationRequired: false,
      transferred: false,
    });

    expect(created.id).toBeDefined();
    expect(created.initials).toBe('TX');
    expect(created.status).toBe('New');

    // 2. Edit
    const updated = await actionRepo.update(created.id, {
      status: 'In Progress',
      comments: 'Lab called, analysis in progress',
    });

    expect(updated.status).toBe('In Progress');
    expect(updated.comments).toBe('Lab called, analysis in progress');

    // 3. Complete
    const completed = await actionRepo.update(created.id, {
      status: 'Completed',
      completedAt: new Date().toISOString(),
    });

    expect(completed.status).toBe('Completed');
    expect(completed.completedAt).toBeDefined();
  });

  it('filters actions by huddle and by status', async () => {
    await actionRepo.create({
      huddleId: 'hud-A',
      initials: 'P1',
      location: 'Majors 1',
      losHours: 1,
      losCategory: '< 2h',
      description: 'Action A1',
      holder: 'Dr Smith',
      priority: 'Routine',
      status: 'New',
      comments: '',
      escalationRequired: false,
      transferred: false,
    });

    await actionRepo.create({
      huddleId: 'hud-A',
      initials: 'P2',
      location: 'Majors 2',
      losHours: 5,
      losCategory: '4 - 12h',
      description: 'Action A2',
      holder: 'Dr Jones',
      priority: 'High',
      status: 'Completed',
      comments: '',
      escalationRequired: false,
      transferred: false,
    });

    await actionRepo.create({
      huddleId: 'hud-B',
      initials: 'P3',
      location: 'Resus 2',
      losHours: 3,
      losCategory: '3 - 4h',
      description: 'Action B1',
      holder: 'ED Nurse',
      priority: 'Medium',
      status: 'In Progress',
      comments: '',
      escalationRequired: false,
      transferred: false,
    });

    const hudAActions = await actionRepo.getByHuddleId('hud-A');
    expect(hudAActions.length).toBe(2);

    const completedActions = hudAActions.filter(a => a.status === 'Completed');
    expect(completedActions.length).toBe(1);
    expect(completedActions[0].initials).toBe('P2');
  });

  it('transfers unresolved actions into a destination huddle with audit history', async () => {
    // Setup source and destination huddle
    const huddle1 = await huddleRepo.create({
      date: '2025-05-26',
      time: '10:00',
      type: 'Dispo',
      shift: 'Day',
      lead: 'Sister Alex Ganea',
      status: 'In Progress',
    });

    const huddle2 = await huddleRepo.create({
      date: '2025-05-26',
      time: '13:00',
      type: 'No-Dispo',
      shift: 'Day',
      lead: 'Dr Hughes',
      status: 'Scheduled',
    });

    // Create an uncompleted action
    const action1 = await actionRepo.create({
      huddleId: huddle1.id,
      initials: 'ZX',
      location: 'Resus 3',
      losHours: 9.0,
      losCategory: '4 - 12h',
      description: 'Specialist surgical consult pending',
      holder: 'Dr Brown',
      priority: 'Critical',
      status: 'In Progress',
      comments: 'Chased at 10:15',
      escalationRequired: true,
      transferred: false,
    });

    // Check transferable actions
    const transferable = await transferService.getTransferableActions(huddle1.id);
    expect(transferable.some(a => a.id === action1.id)).toBe(true);

    // Perform transfer
    const result = await transferService.transferActions({
      actionIds: [action1.id],
      sourceHuddleId: huddle1.id,
      destinationHuddleId: huddle2.id,
      transferNote: 'Follow-up with surgical registrar at 13:00 huddle',
      performedBy: 'Sister Alex Ganea',
    });

    expect(result.success).toBe(true);
    expect(result.transferredCount).toBe(1);
    expect(result.newActionIds.length).toBe(1);

    // Verify original action is marked Transferred
    const originalRefreshed = await actionRepo.getById(action1.id);
    expect(originalRefreshed?.status).toBe('Transferred');
    expect(originalRefreshed?.transferred).toBe(true);
    expect(originalRefreshed?.transferredToHuddleId).toBe(huddle2.id);

    // Verify new action exists in destination huddle with link to source
    const destAction = await actionRepo.getById(result.newActionIds[0]);
    expect(destAction?.huddleId).toBe(huddle2.id);
    expect(destAction?.sourceActionId).toBe(action1.id);
    expect(destAction?.status).toBe('In Progress');
    expect(destAction?.initials).toBe('ZX');

    // Verify audit log
    const auditLogs = await auditRepo.getAll();
    const transferLog = auditLogs.find(l => l.eventType === 'Transferred' && l.entityId === action1.id);
    expect(transferLog).toBeDefined();
    expect(transferLog?.newValue).toBe(huddle2.id);
  });

  it('prevents accidental duplicate transfers into the same destination huddle', async () => {
    const huddle1 = await huddleRepo.create({
      date: '2025-05-26',
      time: '10:00',
      type: 'Dispo',
      shift: 'Day',
      lead: 'Sister Alex Ganea',
      status: 'In Progress',
    });

    const huddle2 = await huddleRepo.create({
      date: '2025-05-26',
      time: '13:00',
      type: 'No-Dispo',
      shift: 'Day',
      lead: 'Dr Hughes',
      status: 'Scheduled',
    });

    const action = await actionRepo.create({
      huddleId: huddle1.id,
      initials: 'DP',
      location: 'Majors 8',
      losHours: 13.0,
      losCategory: '> 12h',
      description: 'Telemetry bed allocation',
      holder: 'Site Team',
      priority: 'Critical',
      status: 'In Progress',
      comments: 'Breach imminent',
      escalationRequired: true,
      transferred: false,
    });

    // First transfer
    const res1 = await transferService.transferActions({
      actionIds: [action.id],
      sourceHuddleId: huddle1.id,
      destinationHuddleId: huddle2.id,
      performedBy: 'Huddle Coordinator',
    });
    expect(res1.transferredCount).toBe(1);

    // Attempt duplicate transfer of same action to same huddle
    const res2 = await transferService.transferActions({
      actionIds: [action.id],
      sourceHuddleId: huddle1.id,
      destinationHuddleId: huddle2.id,
      performedBy: 'Huddle Coordinator',
    });
    expect(res2.transferredCount).toBe(0);
    expect(res2.skippedDuplicateIds).toContain(action.id);
  });

  it('computes overnight dashboard metrics accurately', () => {
    const testHuddles: Huddle[] = [
      {
        id: 'hud-1',
        date: '2025-05-26',
        time: '10:00',
        type: 'Dispo',
        shift: 'Day',
        lead: 'Lead 1',
        status: 'Completed',
        createdAt: '2025-05-26T10:00:00Z',
        updatedAt: '2025-05-26T10:00:00Z',
      },
      {
        id: 'hud-2',
        date: '2025-05-26',
        time: '13:00',
        type: 'No-Dispo',
        shift: 'Day',
        lead: 'Lead 2',
        status: 'In Progress',
        createdAt: '2025-05-26T13:00:00Z',
        updatedAt: '2025-05-26T13:00:00Z',
      }
    ];

    const testActions: OperationalAction[] = [
      {
        id: 'a1',
        huddleId: 'hud-1',
        initials: 'P1',
        location: 'Resus 1',
        losHours: 13,
        losCategory: '> 12h',
        description: 'Critical issue',
        holder: 'Dr Smith',
        priority: 'Critical',
        status: 'In Progress',
        comments: '',
        escalationRequired: true,
        transferred: false,
        createdAt: '2025-05-26T10:00:00Z',
        updatedAt: '2025-05-26T10:00:00Z',
      },
      {
        id: 'a2',
        huddleId: 'hud-1',
        initials: 'P2',
        location: 'Majors 2',
        losHours: 2,
        losCategory: '2 - 3h',
        description: 'Routine bloods',
        holder: 'ED Nurse',
        priority: 'Routine',
        status: 'Completed',
        comments: '',
        escalationRequired: false,
        transferred: false,
        createdAt: '2025-05-26T10:00:00Z',
        updatedAt: '2025-05-26T10:00:00Z',
      }
    ];

    const testSnapshots: DepartmentSnapshot[] = [
      {
        id: 's1',
        huddleId: 'hud-1',
        totalPatients: 65,
        awaitingBeds: 15,
        over12Hours: 7,
        over24Hours: 1,
        staffedSpacesAvailable: 5,
        pressureLevel: 'Level 3 (Severe)',
        mainPressures: ['Bed Capacity', 'Patient Flow'],
        pressuredAreas: ['Majors', 'Resus'],
        trend: 'Deteriorating',
        changeSincePrevious: 'Surge in attendances',
        mainRisk: 'Bed blockage',
        positiveDevelopment: 'Fast streaming',
        escalationIssue: 'CT delay',
        actionRequested: 'Expedite scans',
        escalatedTo: 'Radiology',
        escalationTime: '10:00',
        escalationResponse: 'Noted',
        nextPriority: 'Bed meeting',
        createdAt: '2025-05-26T10:00:00Z',
        updatedAt: '2025-05-26T10:00:00Z',
      }
    ];

    const metrics = MetricsService.computeOvernightDashboard('2025-05-26', testHuddles, testActions, testSnapshots);

    expect(metrics.huddlesCompleted).toBe(1);
    expect(metrics.actionsRaised).toBe(2);
    expect(metrics.actionsCompleted).toBe(1);
    expect(metrics.outstandingActions).toBe(1);
    expect(metrics.criticalRisks).toBe(1);
    expect(metrics.highestPressureLevel).toContain('Level 3');
    expect(metrics.escalationsCount).toBeGreaterThanOrEqual(1);
  });

  it('validates and rejects corrupted prototype JSON import data', async () => {
    const invalidJson = '{"notAValidField": 123}';
    const result = await importPrototypeData(invalidJson);
    expect(result.success).toBe(false);
    expect(result.message).toContain('missing huddles or actions');

    const malformedJson = '{malformed';
    const resultMalformed = await importPrototypeData(malformedJson);
    expect(resultMalformed.success).toBe(false);
  });

  it('supports inline updating and bulk status/holder changes on actions', async () => {
    const a1 = await actionRepo.create({
      huddleId: 'hud-batch-1',
      initials: 'AA',
      location: 'Majors 1',
      losHours: 3.5,
      losCategory: '3 - 4h',
      description: 'Review bloods',
      holder: 'ED Nurse',
      priority: 'Routine',
      status: 'New',
      comments: '',
      escalationRequired: false,
      transferred: false,
    });
    const a2 = await actionRepo.create({
      huddleId: 'hud-batch-1',
      initials: 'BB',
      location: 'Majors 2',
      losHours: 5.0,
      losCategory: '4 - 12h',
      description: 'Surgical consult',
      holder: '',
      priority: 'High',
      status: 'New',
      comments: '',
      escalationRequired: false,
      transferred: false,
    });

    // Inline edit single action comments & escalation
    await actionRepo.update(a1.id, { comments: 'Bloods requested from lab', escalationRequired: true });
    const updatedA1 = await actionRepo.getById(a1.id);
    expect(updatedA1?.comments).toBe('Bloods requested from lab');
    expect(updatedA1?.escalationRequired).toBe(true);

    // Bulk update status to In Progress and assign holder
    await actionRepo.update(a1.id, { status: 'In Progress', holder: 'Flow Coordinator' });
    await actionRepo.update(a2.id, { status: 'In Progress', holder: 'Flow Coordinator' });

    const refetchedA1 = await actionRepo.getById(a1.id);
    const refetchedA2 = await actionRepo.getById(a2.id);
    expect(refetchedA1?.status).toBe('In Progress');
    expect(refetchedA1?.holder).toBe('Flow Coordinator');
    expect(refetchedA2?.status).toBe('In Progress');
    expect(refetchedA2?.holder).toBe('Flow Coordinator');
  });

  it('updates LOS for matching patients and adds new patients when importing pasted lists', async () => {
    // Existing patient in huddle
    const existing = await actionRepo.create({
      huddleId: 'hud-import-test',
      initials: 'JK',
      location: 'Resus 2',
      losHours: 8.0,
      losCategory: '4 - 12h',
      description: 'Awaiting ICU review',
      holder: 'ED Reg',
      priority: 'High',
      status: 'In Progress',
      comments: 'ICU notified',
      escalationRequired: false,
      transferred: false,
    });

    // Simulate import of 2 rows: one existing patient with advanced LOS, one brand new patient
    const pastedRows = [
      {
        initials: 'JK',
        location: 'Resus 2',
        losHours: 13.5,
        losCategory: '> 12h' as const,
      },
      {
        initials: 'LM',
        location: 'Majors 4',
        losHours: 6.25,
        losCategory: '4 - 12h' as const,
      },
    ];

    const currentActions = await actionRepo.getByHuddleId('hud-import-test');
    for (const row of pastedRows) {
      const match = currentActions.find(
        a => a.initials === row.initials && a.location.toLowerCase() === row.location.toLowerCase()
      );
      if (match) {
        await actionRepo.update(match.id, {
          losHours: row.losHours,
          losCategory: row.losCategory,
        });
      } else {
        await actionRepo.create({
          huddleId: 'hud-import-test',
          initials: row.initials,
          location: row.location,
          losHours: row.losHours,
          losCategory: row.losCategory,
          description: '',
          holder: '',
          priority: row.losHours >= 12 ? 'High' : 'Routine',
          status: 'New',
          comments: '',
          escalationRequired: false,
          transferred: false,
        });
      }
    }

    const finalActions = await actionRepo.getByHuddleId('hud-import-test');
    expect(finalActions).toHaveLength(2);

    const updatedJK = finalActions.find(a => a.initials === 'JK');
    expect(updatedJK?.id).toBe(existing.id);
    expect(updatedJK?.losHours).toBe(13.5);
    expect(updatedJK?.losCategory).toBe('> 12h');
    // Existing description, holder and comments were preserved!
    expect(updatedJK?.description).toBe('Awaiting ICU review');
    expect(updatedJK?.holder).toBe('ED Reg');
    expect(updatedJK?.comments).toBe('ICU notified');

    const newLM = finalActions.find(a => a.initials === 'LM');
    expect(newLM?.initials).toBe('LM');
    expect(newLM?.location).toBe('Majors 4');
    expect(newLM?.status).toBe('New');
  });
});
