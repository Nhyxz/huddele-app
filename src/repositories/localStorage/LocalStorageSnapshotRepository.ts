import { DepartmentSnapshot } from '../../models';
import { ISnapshotRepository } from '../interfaces/ISnapshotRepository';
import { INITIAL_SNAPSHOTS } from '../../mock-data/seedData';

const STORAGE_KEY = 'ed_huddle_data_snapshots';

export class LocalStorageSnapshotRepository implements ISnapshotRepository {
  private getStored(): DepartmentSnapshot[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        this.saveAllSync(INITIAL_SNAPSHOTS);
        return INITIAL_SNAPSHOTS;
      }
      return JSON.parse(data) as DepartmentSnapshot[];
    } catch {
      return INITIAL_SNAPSHOTS;
    }
  }

  private saveAllSync(snapshots: DepartmentSnapshot[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  }

  async getAll(): Promise<DepartmentSnapshot[]> {
    return this.getStored();
  }

  async getByHuddleId(huddleId: string): Promise<DepartmentSnapshot | null> {
    const list = this.getStored();
    return list.find(s => s.huddleId === huddleId) || null;
  }

  async getLatestBefore(huddleDate: string, huddleTime: string): Promise<DepartmentSnapshot | null> {
    const list = this.getStored();
    const sorted = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sorted.length > 0 ? sorted[0] : null;
  }

  async createOrUpdate(snapshotData: Omit<DepartmentSnapshot, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<DepartmentSnapshot> {
    const list = this.getStored();
    const now = new Date().toISOString();
    
    // Check if snapshot already exists for this huddle
    const existingIndex = list.findIndex(s => (snapshotData.id && s.id === snapshotData.id) || s.huddleId === snapshotData.huddleId);

    if (existingIndex >= 0) {
      const updated: DepartmentSnapshot = {
        ...list[existingIndex],
        ...snapshotData,
        id: list[existingIndex].id,
        updatedAt: now,
      };
      list[existingIndex] = updated;
      this.saveAllSync(list);
      return updated;
    } else {
      const newSnapshot: DepartmentSnapshot = {
        ...snapshotData,
        id: snapshotData.id || `snp-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        createdAt: now,
        updatedAt: now,
      };
      list.push(newSnapshot);
      this.saveAllSync(list);
      return newSnapshot;
    }
  }

  async saveAll(snapshots: DepartmentSnapshot[]): Promise<void> {
    this.saveAllSync(snapshots);
  }
}
