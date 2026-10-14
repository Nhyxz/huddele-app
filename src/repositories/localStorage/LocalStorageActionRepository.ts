import { OperationalAction } from '../../models';
import { IActionRepository } from '../interfaces/IActionRepository';
import { INITIAL_ACTIONS } from '../../mock-data/seedData';

const STORAGE_KEY = 'ed_huddle_data_actions';

export class LocalStorageActionRepository implements IActionRepository {
  private getStored(): OperationalAction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        this.saveAllSync(INITIAL_ACTIONS);
        return INITIAL_ACTIONS;
      }
      return JSON.parse(data) as OperationalAction[];
    } catch {
      return INITIAL_ACTIONS;
    }
  }

  private saveAllSync(actions: OperationalAction[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
  }

  async getAll(): Promise<OperationalAction[]> {
    return this.getStored();
  }

  async getByHuddleId(huddleId: string): Promise<OperationalAction[]> {
    const list = this.getStored();
    return list.filter(a => a.huddleId === huddleId);
  }

  async getById(id: string): Promise<OperationalAction | null> {
    const list = this.getStored();
    return list.find(a => a.id === id) || null;
  }

  async create(actionData: Omit<OperationalAction, 'id' | 'createdAt' | 'updatedAt'>): Promise<OperationalAction> {
    const list = this.getStored();
    const now = new Date().toISOString();
    const newAction: OperationalAction = {
      ...actionData,
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: now,
      updatedAt: now,
    };
    list.push(newAction);
    this.saveAllSync(list);
    return newAction;
  }

  async update(id: string, updates: Partial<OperationalAction>): Promise<OperationalAction> {
    const list = this.getStored();
    const index = list.findIndex(a => a.id === id);
    if (index === -1) {
      throw new Error(`Action with ID ${id} not found`);
    }
    const updated: OperationalAction = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    this.saveAllSync(list);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const list = this.getStored();
    const filtered = list.filter(a => a.id !== id);
    if (filtered.length !== list.length) {
      this.saveAllSync(filtered);
      return true;
    }
    return false;
  }

  async saveAll(actions: OperationalAction[]): Promise<void> {
    this.saveAllSync(actions);
  }
}
