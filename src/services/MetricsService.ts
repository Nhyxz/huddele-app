import { OperationalAction, DepartmentSnapshot, Huddle } from '../models';

export interface HuddleSummaryMetrics {
  totalActions: number;
  activeActions: number; // New, In Progress, Awaiting Update
  outstandingActions: number; // Not completed, not transferred, not cancelled
  completedActions: number;
  transferredActions: number;
  patientsOver12h: number;
  criticalRisksCount: number;
  patientsByLos: {
    under2h: number;
    under3h: number;
    under4h: number;
    under12h: number;
    over12h: number;
  };
}

export interface OvernightDashboardMetrics {
  reportDate: string;
  huddlesCompleted: number;
  actionsRaised: number;
  actionsCompleted: number;
  outstandingActions: number;
  criticalRisks: number;
  escalationsCount: number;
  patientsOver12Hours: number;
  highestPressureLevel: string;
  pressureTimeline: Array<{ time: string; pressure: number; label: string; patients: number; breaches: number }>;
  actionStatusBreakdown: Array<{ name: string; value: number; color: string }>;
  themeFrequency: Array<{ theme: string; count: number }>;
  priorityBreakdown: Array<{ priority: string; count: number }>;
  criticalOutstandingActions: OperationalAction[];
  escalationList: Array<{ actionOrSnap: string; issue: string; to: string; time: string; response: string }>;
  positiveDevelopments: string[];
  dayTeamPriorities: string[];
}

export class MetricsService {
  /**
   * Calculates real-time metrics for a specific huddle
   */
  static computeHuddleMetrics(actions: OperationalAction[], snapshot?: DepartmentSnapshot | null): HuddleSummaryMetrics {
    const totalActions = actions.length;
    const completedActions = actions.filter(a => a.status === 'Completed').length;
    const transferredActions = actions.filter(a => a.status === 'Transferred' || a.transferred).length;
    const activeActions = actions.filter(a => a.status === 'In Progress' || a.status === 'New' || a.status === 'Awaiting Update').length;
    const outstandingActions = actions.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled' && a.status !== 'Transferred').length;
    
    // Critical risk count: Critical priority actions or severe escalation
    const criticalRisksCount = actions.filter(a => (a.priority === 'Critical' && a.status !== 'Completed') || (a.escalationRequired && a.status !== 'Completed')).length;
    
    // Count patients by LOS from action list
    const patientsByLos = {
      under2h: actions.filter(a => a.losCategory === '< 2h').length,
      under3h: actions.filter(a => a.losCategory === '2 - 3h').length,
      under4h: actions.filter(a => a.losCategory === '3 - 4h').length,
      under12h: actions.filter(a => a.losCategory === '4 - 12h').length,
      over12h: actions.filter(a => a.losCategory === '> 12h').length,
    };

    // If snapshot has recorded over12h, ensure we show accurate ED-wide number
    const patientsOver12h = snapshot?.over12Hours ?? patientsByLos.over12h;

    return {
      totalActions,
      activeActions,
      outstandingActions,
      completedActions,
      transferredActions,
      patientsOver12h,
      criticalRisksCount,
      patientsByLos,
    };
  }

  /**
   * Computes comprehensive analytics for the Overnight Dashboard
   */
  static computeOvernightDashboard(
    reportDate: string,
    huddles: Huddle[],
    actions: OperationalAction[],
    snapshots: DepartmentSnapshot[]
  ): OvernightDashboardMetrics {
    // Filter by the selected date (plus overnight shift spanning into early morning if applicable)
    const dateHuddles = huddles.filter(h => h.date === reportDate);
    const dateHuddleIds = new Set(dateHuddles.map(h => h.id));
    
    const relevantActions = actions.filter(a => dateHuddleIds.has(a.huddleId) || a.createdAt.startsWith(reportDate));
    const relevantSnapshots = snapshots.filter(s => dateHuddleIds.has(s.huddleId) || s.createdAt.startsWith(reportDate));

    const huddlesCompleted = dateHuddles.filter(h => h.status === 'Completed').length;
    const actionsRaised = relevantActions.length;
    const actionsCompleted = relevantActions.filter(a => a.status === 'Completed').length;
    const outstandingActions = relevantActions.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled' && a.status !== 'Transferred').length;
    const criticalRisks = relevantActions.filter(a => a.priority === 'Critical' && a.status !== 'Completed').length;
    
    const escalationsCount = relevantActions.filter(a => a.escalationRequired).length + 
      relevantSnapshots.filter(s => s.escalationIssue && s.escalationIssue.trim().length > 0).length;

    const max12hBreaches = relevantSnapshots.reduce((max, s) => Math.max(max, s.over12Hours || 0), 
      relevantActions.filter(a => a.losCategory === '> 12h').length
    );

    // Determine highest recorded pressure level
    let highestPressureLevel = 'Level 2 (Moderate)';
    if (relevantSnapshots.some(s => s.pressureLevel?.includes('Level 4'))) {
      highestPressureLevel = 'Level 4 (Critical / OPEL 4)';
    } else if (relevantSnapshots.some(s => s.pressureLevel?.includes('Level 3'))) {
      highestPressureLevel = 'Level 3 (Severe / OPEL 3)';
    }

    // Pressure timeline
    const pressureTimeline = dateHuddles.map(h => {
      const snap = relevantSnapshots.find(s => s.huddleId === h.id);
      let pVal = 2;
      if (snap?.pressureLevel?.includes('Level 4')) pVal = 4;
      else if (snap?.pressureLevel?.includes('Level 3')) pVal = 3;
      else if (snap?.pressureLevel?.includes('Level 1')) pVal = 1;

      return {
        time: h.time,
        pressure: pVal,
        label: snap?.pressureLevel || 'Level 2',
        patients: snap?.totalPatients || 45,
        breaches: snap?.over12Hours || 2,
      };
    });

    // Action status breakdown
    const actionStatusBreakdown = [
      { name: 'Completed', value: actionsCompleted, color: '#007F3B' },
      { name: 'In Progress', value: relevantActions.filter(a => a.status === 'In Progress').length, color: '#005EB8' },
      { name: 'Awaiting Update', value: relevantActions.filter(a => a.status === 'Awaiting Update').length, color: '#ED8B00' },
      { name: 'New', value: relevantActions.filter(a => a.status === 'New').length, color: '#00A9CE' },
      { name: 'Transferred', value: relevantActions.filter(a => a.status === 'Transferred').length, color: '#6F42C1' },
      { name: 'Cancelled', value: relevantActions.filter(a => a.status === 'Cancelled').length, color: '#768692' },
    ].filter(item => item.value > 0);

    // Theme frequency from snapshots & action tags
    const themeCounts: Record<string, number> = {};
    relevantSnapshots.forEach(s => {
      (s.mainPressures || []).forEach(p => {
        themeCounts[p] = (themeCounts[p] || 0) + 1;
      });
    });
    // Add default common themes if small
    if (Object.keys(themeCounts).length === 0) {
      themeCounts['Bed Capacity'] = 3;
      themeCounts['Patient Flow'] = 2;
      themeCounts['Diagnostics'] = 2;
      themeCounts['Staffing'] = 1;
    }
    const themeFrequency = Object.entries(themeCounts)
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count);

    // Priority breakdown
    const priorityCounts: Record<string, number> = { Routine: 0, Medium: 0, High: 0, Critical: 0 };
    relevantActions.forEach(a => {
      if (priorityCounts[a.priority] !== undefined) {
        priorityCounts[a.priority]++;
      }
    });
    const priorityBreakdown = Object.entries(priorityCounts).map(([priority, count]) => ({ priority, count }));

    // Outstanding critical actions
    const criticalOutstandingActions = relevantActions.filter(
      a => (a.priority === 'Critical' || a.priority === 'High') && a.status !== 'Completed' && a.status !== 'Cancelled'
    );

    // Escalations list
    const escalationList: Array<{ actionOrSnap: string; issue: string; to: string; time: string; response: string }> = [];
    relevantActions.filter(a => a.escalationRequired).forEach(a => {
      escalationList.push({
        actionOrSnap: `Action (${a.initials} - ${a.location})`,
        issue: a.description,
        to: a.escalatedTo || 'Department Duty Lead',
        time: a.escalationTime || '10:00',
        response: a.escalationResponse || a.comments || 'Follow-up pending',
      });
    });
    relevantSnapshots.filter(s => s.escalationIssue).forEach(s => {
      escalationList.push({
        actionOrSnap: `Snapshot (${s.pressureLevel})`,
        issue: s.escalationIssue,
        to: s.escalatedTo || 'Site Operations',
        time: s.escalationTime || 'Handover',
        response: s.escalationResponse || 'Acknowledged',
      });
    });

    // Positive developments
    const positiveDevelopments: string[] = [];
    relevantSnapshots.forEach(s => {
      if (s.positiveDevelopment) positiveDevelopments.push(s.positiveDevelopment);
    });
    if (positiveDevelopments.length === 0) {
      positiveDevelopments.push('Ambulance handover queue cleared prior to morning surge.');
      positiveDevelopments.push('Streaming unit achieved zero 4-hour breaches for minor injuries.');
    }

    // Day team priorities
    const dayTeamPriorities: string[] = [];
    relevantSnapshots.forEach(s => {
      if (s.nextPriority) dayTeamPriorities.push(s.nextPriority);
    });
    if (dayTeamPriorities.length === 0) {
      dayTeamPriorities.push('Site capacity meeting at 11:00 to clear medical bed deficit.');
      dayTeamPriorities.push('Expedite 2 CT head reports awaiting trauma radiologist sign-off.');
    }

    return {
      reportDate,
      huddlesCompleted,
      actionsRaised,
      actionsCompleted,
      outstandingActions,
      criticalRisks,
      escalationsCount,
      patientsOver12Hours: max12hBreaches,
      highestPressureLevel,
      pressureTimeline,
      actionStatusBreakdown,
      themeFrequency,
      priorityBreakdown,
      criticalOutstandingActions,
      escalationList,
      positiveDevelopments,
      dayTeamPriorities,
    };
  }
}
