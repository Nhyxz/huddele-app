import { Huddle } from '../../models';
import { IHuddleRepository } from '../interfaces/IHuddleRepository';
import { INITIAL_HUDDLES } from '../../mock-data/seedData';

const STORAGE_KEY = 'ed_huddle_data_huddles';

export class LocalStorageHuddleRepository implements IHuddleRepository {
  private getStored(): Huddle[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        this.saveAllSync(INITIAL_HUDDLES);
        return INITIAL_HUDDLES;
      }
      return JSON.parse(data) as Huddle[];
    } catch {
      return INITIAL_HUDDLES;
    }
  }

  private saveAllSync(huddles: Huddle[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(huddles));
  }

  async getAll(): Promise<Huddle[]> {
    return this.getStored();
  }

  async getById(id: string): Promise<Huddle | null> {
    const list = this.getStored();
    return list.find(h => h.id === id) || null;
  }

  async getByDate(date: string): Promise<Huddle[]> {
    const list = this.getStored();
    return list.filter(h => h.date === date);
  }

  async create(huddleData: Omit<Huddle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Huddle> {
    const list = this.getStored();
    const now = new Date().toISOString();
    const newHuddle: Huddle = {
      ...huddleData,
      id: `hud-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      createdAt: now,
      updatedAt: now,
    };
    list.push(newHuddle);
    this.saveAllSync(list);
    return newHuddle;
  }

  async update(id: string, updates: Partial<Huddle>): Promise<Huddle> {
    const list = this.getStored();
    const index = list.findIndex(h => h.id === id);
    if (index === -1) {
      throw new Error(`Huddle with ID ${id} not found`);
    }
    const updated: Huddle = {
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
    const filtered = list.filter(h => h.id !== id);
    if (filtered.length !== list.length) {
      this.saveAllSync(filtered);
      return true;
    }
    return false;
  }

  async saveAll(huddles: Huddle[]): Promise<void> {
    this.saveAllSync(huddles);
  }
}
