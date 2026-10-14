import { Huddle } from '../../models';

export interface IHuddleRepository {
  getAll(): Promise<Huddle[]>;
  getById(id: string): Promise<Huddle | null>;
  getByDate(date: string): Promise<Huddle[]>;
  create(huddle: Omit<Huddle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Huddle>;
  update(id: string, updates: Partial<Huddle>): Promise<Huddle>;
  delete(id: string): Promise<boolean>;
  saveAll(huddles: Huddle[]): Promise<void>;
}
