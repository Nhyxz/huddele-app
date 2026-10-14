export type ShiftType = 'Day' | 'Late' | 'Twilight' | 'Night';
export type HuddleType = 'Dispo' | 'No-Dispo';
export type HuddleStatus = 'Scheduled' | 'In Progress' | 'Completed';

export interface Huddle {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: HuddleType;
  shift: ShiftType;
  lead: string;
  status: HuddleStatus;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  editReason?: string;
}

export type LOSCategory = '< 2h' | '2 - 3h' | '3 - 4h' | '4 - 12h' | '> 12h';
export type ActionPriority = 'Routine' | 'Medium' | 'High' | 'Critical';
export type ActionStatus = 'New' | 'In Progress' | 'Awaiting Update' | 'Completed' | 'Transferred' | 'Cancelled';

export interface OperationalAction {
  id: string;
  huddleId: string;
  sourceActionId?: string; // If transferred from another action
  initials: string;
  location: string;
  losHours: number;
  losCategory: LOSCategory;
  description: string;
  holder: string;
  priority: ActionPriority;
  status: ActionStatus;
  comments: string;
  targetReviewTime?: string;
  escalationRequired: boolean;
  escalatedTo?: string;
  escalationTime?: string;
  escalationResponse?: string;
  transferred: boolean;
  transferredFromHuddleId?: string;
  transferredToHuddleId?: string;
  transferNote?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type TrendType = 'Improving' | 'Stable' | 'Deteriorating';
export type PressureLevel = 'Level 1 (Normal)' | 'Level 2 (Moderate)' | 'Level 3 (Severe)' | 'Level 4 (Critical/OPEL 4)';

export interface DepartmentSnapshot {
  id: string;
  huddleId: string;
  totalPatients: number;
  awaitingBeds: number;
  over12Hours: number;
  over24Hours: number;
  staffedSpacesAvailable: number;
  pressureLevel: PressureLevel;
  mainPressures: string[]; // Up to 3 selections
  pressuredAreas: string[];
  trend: TrendType;
  changeSincePrevious: string;
  mainRisk: string;
  positiveDevelopment: string;
  escalationIssue: string;
  actionRequested: string;
  escalatedTo: string;
  escalationTime: string;
  escalationResponse: string;
  nextPriority: string;
  isCopiedFromPrevious?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AuditEntityType = 'Huddle' | 'Action' | 'DepartmentSnapshot' | 'Settings';
export type AuditEventType = 'Created' | 'Updated' | 'StatusChanged' | 'Transferred' | 'Completed' | 'Deleted' | 'Duplicated' | 'Reset';

export interface AuditEvent {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  eventType: AuditEventType;
  summary: string;
  previousValue?: string;
  newValue?: string;
  performedBy: string;
  timestamp: string;
  reason?: string;
}

export interface ReportSource {
  id: string;
  name: string;
  enabled: boolean;
  connectionType: string;
  status: 'Active' | 'Requires Approved Connection' | 'Planned Integration';
  lastUpdated?: string;
  description: string;
}

export type UserRole = 
  | 'Huddle Coordinator'
  | 'Nurse in Charge'
  | 'Operational Manager'
  | 'Read Only Viewer'
  | 'System Administrator';

export interface AppSettings {
  departmentName: string;
  hospitalName: string;
  huddleTimes: Array<{ time: string; type: HuddleType; shift: ShiftType }>;
  shiftNames: ShiftType[];
  locations: string[];
  actionHolders: string[];
  pressureCategories: string[];
  pressuredAreaOptions: string[];
  activeRole: UserRole;
  userName: string;
}
