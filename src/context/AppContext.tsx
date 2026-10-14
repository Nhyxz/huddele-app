import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Huddle, 
  OperationalAction, 
  DepartmentSnapshot, 
  AuditEvent, 
  ReportSource, 
  AppSettings, 
  UserRole 
} from '../models';
import { 
  huddleRepository, 
  actionRepository, 
  snapshotRepository, 
  auditRepository, 
  settingsRepository, 
  reportRepository, 
  resetPrototypeData 
} from '../repositories';
import { TransferService } from '../services/TransferService';
import { ParsedPatientRow, matchKey } from '../utils/patientListParser';

interface AppContextType {
  huddles: Huddle[];
  currentHuddle: Huddle | null;
  actions: OperationalAction[];
  currentHuddleActions: OperationalAction[];
  snapshots: DepartmentSnapshot[];
  currentSnapshot: DepartmentSnapshot | null;
  sources: ReportSource[];
  settings: AppSettings;
  auditEvents: AuditEvent[];
  activeRole: UserRole;
  transferService: TransferService;
  isLoading: boolean;
  
  // State setters & actions
  setCurrentHuddleId: (id: string) => void;
  setActiveRole: (role: UserRole) => void;
  refreshData: () => Promise<void>;
  
  // Huddle actions
  startHuddle: (id: string) => Promise<void>;
  completeHuddle: (id: string) => Promise<void>;
  createHuddle: (data: Omit<Huddle, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Huddle>;
  updateHuddle: (id: string, updates: Partial<Huddle>, reason?: string) => Promise<void>;
  
  // Action operations
  saveAction: (actionData: Partial<OperationalAction>) => Promise<OperationalAction>;
  deleteAction: (id: string) => Promise<void>;
  duplicateAction: (id: string) => Promise<OperationalAction>;
  updateActionStatus: (id: string, status: OperationalAction['status']) => Promise<void>;
  quickUpdateAction: (id: string, updates: Partial<OperationalAction>) => Promise<void>;
  bulkUpdateActions: (ids: string[], updates: Partial<OperationalAction>) => Promise<void>;
  bulkDeleteActions: (ids: string[]) => Promise<void>;
  importPatientRows: (huddleId: string, rows: ParsedPatientRow[]) => Promise<void>;
  
  // Snapshot operations
  saveSnapshot: (snapshotData: Partial<DepartmentSnapshot>) => Promise<DepartmentSnapshot>;
  copyPreviousSnapshot: (targetHuddleId: string) => Promise<DepartmentSnapshot | null>;
  
  // Prototype management
  resetAllDemoData: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  
  // Toast notifications
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [huddles, setHuddles] = useState<Huddle[]>([]);
  const [currentHuddleId, setCurrentHuddleIdState] = useState<string>('hud-20250526-1000');
  const [actions, setActions] = useState<OperationalAction[]>([]);
  const [snapshots, setSnapshots] = useState<DepartmentSnapshot[]>([]);
  const [sources, setSources] = useState<ReportSource[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    departmentName: 'Emergency Department',
    hospitalName: 'St Jude NHS Foundation Trust',
    huddleTimes: [],
    shiftNames: ['Day', 'Late', 'Twilight', 'Night'],
    locations: [],
    actionHolders: [],
    pressureCategories: [],
    pressuredAreaOptions: [],
    activeRole: 'Huddle Coordinator',
    userName: 'Alex Ganea (Sister / Huddle Lead)',
  });
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [activeRole, setActiveRoleState] = useState<UserRole>('Huddle Coordinator');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const transferService = new TransferService(actionRepository, huddleRepository, auditRepository);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [hList, aList, sList, rSources, stgs, audList] = await Promise.all([
        huddleRepository.getAll(),
        actionRepository.getAll(),
        snapshotRepository.getAll(),
        reportRepository.getSources(),
        settingsRepository.getSettings(),
        auditRepository.getAll(),
      ]);

      setHuddles(hList);
      setActions(aList);
      setSnapshots(sList);
      setSources(rSources);
      setSettings(stgs);
      setActiveRoleState(stgs.activeRole);
      setAuditEvents(audList);

      // Default to first huddle if current is not in list
      if (hList.length > 0 && !hList.some(h => h.id === currentHuddleId)) {
        setCurrentHuddleIdState(hList[0].id);
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
      showNotification('Failed to load local data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentHuddleId, showNotification]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const currentHuddle = huddles.find(h => h.id === currentHuddleId) || huddles[0] || null;
  const currentHuddleActions = actions.filter(a => a.huddleId === currentHuddle?.id);
  const currentSnapshot = snapshots.find(s => s.huddleId === currentHuddle?.id) || null;

  const setCurrentHuddleId = (id: string) => {
    setCurrentHuddleIdState(id);
  };

  const setActiveRole = async (role: UserRole) => {
    setActiveRoleState(role);
    await settingsRepository.updateSettings({ activeRole: role });
    showNotification(`Switched demo role to: ${role}`, 'info');
  };

  const startHuddle = async (id: string) => {
    const updated = await huddleRepository.update(id, {
      status: 'In Progress',
      startedAt: new Date().toISOString(),
    });
    await auditRepository.log({
      entityType: 'Huddle',
      entityId: id,
      eventType: 'StatusChanged',
      summary: `Huddle started (${updated.time})`,
      performedBy: settings.userName,
    });
    await refreshData();
    showNotification(`Huddle (${updated.time}) started`, 'success');
  };

  const completeHuddle = async (id: string) => {
    const updated = await huddleRepository.update(id, {
      status: 'Completed',
      completedAt: new Date().toISOString(),
    });
    await auditRepository.log({
      entityType: 'Huddle',
      entityId: id,
      eventType: 'Completed',
      summary: `Huddle completed (${updated.time})`,
      performedBy: settings.userName,
    });
    await refreshData();
    showNotification(`Huddle (${updated.time}) completed`, 'success');
  };

  const createHuddle = async (data: Omit<Huddle, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newHuddle = await huddleRepository.create(data);
    await auditRepository.log({
      entityType: 'Huddle',
      entityId: newHuddle.id,
      eventType: 'Created',
      summary: `Created ${newHuddle.time} ${newHuddle.type} Huddle for ${newHuddle.date}`,
      performedBy: settings.userName,
    });
    await refreshData();
    setCurrentHuddleIdState(newHuddle.id);
    showNotification(`Created new huddle: ${newHuddle.time}`, 'success');
    return newHuddle;
  };

  const updateHuddle = async (id: string, updates: Partial<Huddle>, reason?: string) => {
    const updated = await huddleRepository.update(id, {
      ...updates,
      editReason: reason,
    });
    await auditRepository.log({
      entityType: 'Huddle',
      entityId: id,
      eventType: 'Updated',
      summary: `Huddle details updated (${updated.time})`,
      performedBy: settings.userName,
      reason: reason || 'Operational adjustment',
    });
    await refreshData();
    showNotification(`Huddle updated`, 'success');
  };

  const saveAction = async (actionData: Partial<OperationalAction>): Promise<OperationalAction> => {
    let result: OperationalAction;
    if (actionData.id) {
      // Edit existing
      const existing = actions.find(a => a.id === actionData.id);
      result = await actionRepository.update(actionData.id, actionData);
      await auditRepository.log({
        entityType: 'Action',
        entityId: result.id,
        eventType: 'Updated',
        summary: `Action '${result.description}' updated for patient ${result.initials}`,
        previousValue: existing?.status,
        newValue: result.status,
        performedBy: settings.userName,
      });
      showNotification(`Action updated for ${result.initials}`, 'success');
    } else {
      // Create new
      const targetHuddleId = actionData.huddleId || currentHuddle?.id || 'hud-20250526-1000';
      result = await actionRepository.create({
        huddleId: targetHuddleId,
        initials: (actionData.initials || 'XX').toUpperCase().trim(),
        location: actionData.location || 'Majors 1',
        losHours: actionData.losHours || 1.5,
        losCategory: actionData.losCategory || '< 2h',
        description: actionData.description || 'Clinical review',
        holder: actionData.holder || 'ED Nurse',
        priority: actionData.priority || 'Routine',
        status: actionData.status || 'New',
        comments: actionData.comments || '',
        targetReviewTime: actionData.targetReviewTime || '',
        escalationRequired: !!actionData.escalationRequired,
        escalatedTo: actionData.escalatedTo || '',
        escalationTime: actionData.escalationTime || '',
        escalationResponse: actionData.escalationResponse || '',
        transferred: false,
      });
      await auditRepository.log({
        entityType: 'Action',
        entityId: result.id,
        eventType: 'Created',
        summary: `New action created: '${result.description}' (${result.initials} - ${result.location})`,
        performedBy: settings.userName,
      });
      showNotification(`Action added for ${result.initials}`, 'success');
    }
    await refreshData();
    return result;
  };

  const deleteAction = async (id: string) => {
    const action = actions.find(a => a.id === id);
    await actionRepository.delete(id);
    await auditRepository.log({
      entityType: 'Action',
      entityId: id,
      eventType: 'Deleted',
      summary: `Action deleted (${action?.initials} - ${action?.description})`,
      performedBy: settings.userName,
    });
    await refreshData();
    showNotification(`Action deleted`, 'info');
  };

  const duplicateAction = async (id: string) => {
    const action = actions.find(a => a.id === id);
    if (!action) throw new Error('Action not found');
    const newAction = await actionRepository.create({
      ...action,
      description: `${action.description} (Copy)`,
      status: 'New',
      transferred: false,
      sourceActionId: undefined,
    });
    await auditRepository.log({
      entityType: 'Action',
      entityId: newAction.id,
      eventType: 'Duplicated',
      summary: `Duplicated action from ${action.id} for patient ${action.initials}`,
      performedBy: settings.userName,
    });
    await refreshData();
    showNotification(`Duplicated action for ${action.initials}`, 'success');
    return newAction;
  };

  const updateActionStatus = async (id: string, status: OperationalAction['status']) => {
    const action = actions.find(a => a.id === id);
    const updates: Partial<OperationalAction> = { status };
    if (status === 'Completed') {
      updates.completedAt = new Date().toISOString();
    }
    const updated = await actionRepository.update(id, updates);
    await auditRepository.log({
      entityType: 'Action',
      entityId: id,
      eventType: 'StatusChanged',
      summary: `Status changed from ${action?.status} to ${status} (${updated.initials})`,
      previousValue: action?.status,
      newValue: status,
      performedBy: settings.userName,
    });
    await refreshData();
    showNotification(`Action status marked as ${status}`, 'success');
  };

  const quickUpdateAction = async (id: string, updates: Partial<OperationalAction>) => {
    const existing = actions.find(a => a.id === id);
    if (!existing) return;
    const nextUpdates: Partial<OperationalAction> = { ...updates };
    if (updates.status === 'Completed' && existing.status !== 'Completed') {
      nextUpdates.completedAt = new Date().toISOString();
    }
    const updated = await actionRepository.update(id, nextUpdates);
    const changedKey = Object.keys(updates)[0] as keyof OperationalAction | undefined;
    await auditRepository.log({
      entityType: 'Action',
      entityId: id,
      eventType: updates.status ? 'StatusChanged' : 'Updated',
      summary: `Inline edit (${changedKey || 'details'}) for patient ${updated.initials}`,
      previousValue: changedKey ? String((existing as any)[changedKey] ?? '') : undefined,
      newValue: changedKey ? String((updates as any)[changedKey] ?? '') : undefined,
      performedBy: settings.userName,
    });
    await refreshData();
  };

  const bulkUpdateActions = async (ids: string[], updates: Partial<OperationalAction>) => {
    if (ids.length === 0) return;
    const nextUpdates: Partial<OperationalAction> = { ...updates };
    if (updates.status === 'Completed') {
      nextUpdates.completedAt = new Date().toISOString();
    }
    for (const id of ids) {
      await actionRepository.update(id, nextUpdates);
      await auditRepository.log({
        entityType: 'Action',
        entityId: id,
        eventType: updates.status ? 'StatusChanged' : 'Updated',
        summary: `Bulk update applied (${Object.keys(updates).join(', ')})`,
        performedBy: settings.userName,
      });
    }
    await refreshData();
    showNotification(`Updated ${ids.length} action(s)`, 'success');
  };

  const bulkDeleteActions = async (ids: string[]) => {
    if (ids.length === 0) return;
    for (const id of ids) {
      await actionRepository.delete(id);
      await auditRepository.log({
        entityType: 'Action',
        entityId: id,
        eventType: 'Deleted',
        summary: `Bulk deleted action ${id}`,
        performedBy: settings.userName,
      });
    }
    await refreshData();
    showNotification(`Deleted ${ids.length} action(s)`, 'info');
  };

  const importPatientRows = async (huddleId: string, rows: ParsedPatientRow[]) => {
    if (rows.length === 0) return;
    const currentActions = await actionRepository.getByHuddleId(huddleId);
    let newCount = 0;
    let updateCount = 0;

    for (const row of rows) {
      const match = currentActions.find(
        a => a.status !== 'Transferred' && !a.transferred && matchKey(a.initials, a.location) === matchKey(row.initials, row.location)
      );

      if (match) {
        await actionRepository.update(match.id, {
          losHours: row.losHours,
          losCategory: row.losCategory,
        });
        updateCount++;
      } else {
        await actionRepository.create({
          huddleId,
          initials: row.initials,
          location: row.location,
          losHours: row.losHours,
          losCategory: row.losCategory,
          description: '',
          holder: '',
          priority: row.losHours >= 12 ? 'High' : 'Routine',
          status: 'New',
          comments: '',
          targetReviewTime: '',
          escalationRequired: false,
          escalatedTo: '',
          escalationTime: '',
          escalationResponse: '',
          transferred: false,
        });
        newCount++;
      }
    }

    await auditRepository.log({
      entityType: 'Huddle',
      entityId: huddleId,
      eventType: 'Updated',
      summary: `Imported patient list (${newCount} new, ${updateCount} LOS updated)`,
      performedBy: settings.userName,
    });

    await refreshData();
    showNotification(`Imported ${rows.length} patient records (${newCount} added, ${updateCount} updated)`, 'success');
  };

  const saveSnapshot = async (snapshotData: Partial<DepartmentSnapshot>): Promise<DepartmentSnapshot> => {
    const targetHuddleId = snapshotData.huddleId || currentHuddle?.id || 'hud-20250526-1000';
    const saved = await snapshotRepository.createOrUpdate({
      huddleId: targetHuddleId,
      totalPatients: snapshotData.totalPatients ?? 60,
      awaitingBeds: snapshotData.awaitingBeds ?? 10,
      over12Hours: snapshotData.over12Hours ?? 2,
      over24Hours: snapshotData.over24Hours ?? 0,
      staffedSpacesAvailable: snapshotData.staffedSpacesAvailable ?? 5,
      pressureLevel: snapshotData.pressureLevel ?? 'Level 2 (Moderate)',
      mainPressures: snapshotData.mainPressures ?? ['Bed Capacity'],
      pressuredAreas: snapshotData.pressuredAreas ?? ['Majors'],
      trend: snapshotData.trend ?? 'Stable',
      changeSincePrevious: snapshotData.changeSincePrevious ?? '',
      mainRisk: snapshotData.mainRisk ?? '',
      positiveDevelopment: snapshotData.positiveDevelopment ?? '',
      escalationIssue: snapshotData.escalationIssue ?? '',
      actionRequested: snapshotData.actionRequested ?? '',
      escalatedTo: snapshotData.escalatedTo ?? '',
      escalationTime: snapshotData.escalationTime ?? '',
      escalationResponse: snapshotData.escalationResponse ?? '',
      nextPriority: snapshotData.nextPriority ?? '',
      isCopiedFromPrevious: false,
    });
    await auditRepository.log({
      entityType: 'DepartmentSnapshot',
      entityId: saved.id,
      eventType: 'Updated',
      summary: `Department snapshot recorded for huddle ${targetHuddleId}`,
      performedBy: settings.userName,
    });
    await refreshData();
    showNotification('Department snapshot saved successfully', 'success');
    return saved;
  };

  const copyPreviousSnapshot = async (targetHuddleId: string): Promise<DepartmentSnapshot | null> => {
    // Find the latest snapshot prior to this huddle
    const targetHuddle = huddles.find(h => h.id === targetHuddleId);
    if (!targetHuddle) return null;

    const otherSnapshots = snapshots.filter(s => s.huddleId !== targetHuddleId);
    if (otherSnapshots.length === 0) {
      showNotification('No previous snapshot available to copy', 'info');
      return null;
    }

    // Sort by createdAt descending
    const sorted = [...otherSnapshots].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const previous = sorted[0];

    const copiedSnapshot = await snapshotRepository.createOrUpdate({
      huddleId: targetHuddleId,
      totalPatients: previous.totalPatients,
      awaitingBeds: previous.awaitingBeds,
      over12Hours: previous.over12Hours,
      over24Hours: previous.over24Hours,
      staffedSpacesAvailable: previous.staffedSpacesAvailable,
      pressureLevel: previous.pressureLevel,
      mainPressures: [...previous.mainPressures],
      pressuredAreas: [...previous.pressuredAreas],
      trend: previous.trend,
      changeSincePrevious: `[Copied from previous snapshot - please verify] ${previous.changeSincePrevious}`,
      mainRisk: `[Copied] ${previous.mainRisk}`,
      positiveDevelopment: `[Copied] ${previous.positiveDevelopment}`,
      escalationIssue: previous.escalationIssue ? `[Copied] ${previous.escalationIssue}` : '',
      actionRequested: previous.actionRequested,
      escalatedTo: previous.escalatedTo,
      escalationTime: previous.escalationTime,
      escalationResponse: previous.escalationResponse,
      nextPriority: `[Copied] ${previous.nextPriority}`,
      isCopiedFromPrevious: true,
    });

    await refreshData();
    showNotification('Copied previous snapshot details for review', 'info');
    return copiedSnapshot;
  };

  const resetAllDemoData = async () => {
    await resetPrototypeData();
    await refreshData();
    showNotification('Demonstration data reset to initial prototype state', 'success');
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    const updated = await settingsRepository.updateSettings(updates);
    setSettings(updated);
    showNotification('Settings updated', 'success');
  };

  return (
    <AppContext.Provider
      value={{
        huddles,
        currentHuddle,
        actions,
        currentHuddleActions,
        snapshots,
        currentSnapshot,
        sources,
        settings,
        auditEvents,
        activeRole,
        transferService,
        isLoading,
        setCurrentHuddleId,
        setActiveRole,
        refreshData,
        startHuddle,
        completeHuddle,
        createHuddle,
        updateHuddle,
        saveAction,
        deleteAction,
        duplicateAction,
        updateActionStatus,
        quickUpdateAction,
        bulkUpdateActions,
        bulkDeleteActions,
        importPatientRows,
        saveSnapshot,
        copyPreviousSnapshot,
        resetAllDemoData,
        updateSettings,
        notification,
        showNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
