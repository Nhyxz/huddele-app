import { AuditEvent } from '../../models';
import { IAuditRepository } from '../interfaces/IAuditRepository';
import { INITIAL_AUDIT_EVENTS } from '../../mock-data/seedData';

const STORAGE_KEY = 'ed_huddle_data_audit';

export class LocalStorageAuditRepository implements IAuditRepository {
  private getStored(): AuditEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        this.saveAllSync(INITIAL_AUDIT_EVENTS);
        return INITIAL_AUDIT_EVENTS;
      }
      return JSON.parse(data) as AuditEvent[];
    } catch {
      return INITIAL_AUDIT_EVENTS;
    }
  }

  private saveAllSync(events: AuditEvent[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }

  async getAll(): Promise<AuditEvent[]> {
    return this.getStored();
  }

  async getByEntity(entityType: string, entityId: string): Promise<AuditEvent[]> {
    const list = this.getStored();
    return list.filter(e => e.entityType === entityType && e.entityId === entityId);
  }

  async log(eventData: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<AuditEvent> {
    const list = this.getStored();
    const event: AuditEvent = {
      ...eventData,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    list.unshift(event); // Newest first
    this.saveAllSync(list);
    return event;
  }

  async saveAll(events: AuditEvent[]): Promise<void> {
    this.saveAllSync(events);
  }

  async clear(): Promise<void> {
    this.saveAllSync([]);
  }
}
