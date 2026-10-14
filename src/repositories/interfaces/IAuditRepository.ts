import { AuditEvent } from '../../models';

export interface IAuditRepository {
  getAll(): Promise<AuditEvent[]>;
  getByEntity(entityType: string, entityId: string): Promise<AuditEvent[]>;
  log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<AuditEvent>;
  saveAll(events: AuditEvent[]): Promise<void>;
  clear(): Promise<void>;
}
