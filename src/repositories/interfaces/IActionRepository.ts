import { OperationalAction } from '../../models';

export interface IActionRepository {
  getAll(): Promise<OperationalAction[]>;
  getByHuddleId(huddleId: string): Promise<OperationalAction[]>;
  getById(id: string): Promise<OperationalAction | null>;
  create(action: Omit<OperationalAction, 'id' | 'createdAt' | 'updatedAt'>): Promise<OperationalAction>;
  update(id: string, updates: Partial<OperationalAction>): Promise<OperationalAction>;
  delete(id: string): Promise<boolean>;
  saveAll(actions: OperationalAction[]): Promise<void>;
}
