import { DepartmentSnapshot } from '../../models';

export interface ISnapshotRepository {
  getAll(): Promise<DepartmentSnapshot[]>;
  getByHuddleId(huddleId: string): Promise<DepartmentSnapshot | null>;
  getLatestBefore(huddleDate: string, huddleTime: string): Promise<DepartmentSnapshot | null>;
  createOrUpdate(snapshot: Omit<DepartmentSnapshot, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<DepartmentSnapshot>;
  saveAll(snapshots: DepartmentSnapshot[]): Promise<void>;
}
