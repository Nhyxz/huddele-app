import { ReportSource } from '../../models';
import { IReportRepository } from '../interfaces/IReportRepository';
import { INITIAL_REPORT_SOURCES } from '../../mock-data/seedData';

const STORAGE_KEY = 'ed_huddle_data_sources';

export class LocalStorageReportRepository implements IReportRepository {
  private getStored(): ReportSource[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        this.saveAllSync(INITIAL_REPORT_SOURCES);
        return INITIAL_REPORT_SOURCES;
      }
      return JSON.parse(data) as ReportSource[];
    } catch {
      return INITIAL_REPORT_SOURCES;
    }
  }

  private saveAllSync(sources: ReportSource[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
  }

  async getSources(): Promise<ReportSource[]> {
    return this.getStored();
  }

  async updateSource(id: string, updates: Partial<ReportSource>): Promise<ReportSource> {
    const list = this.getStored();
    const index = list.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error(`Report source with ID ${id} not found`);
    }
    const updated: ReportSource = {
      ...list[index],
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
    list[index] = updated;
    this.saveAllSync(list);
    return updated;
  }

  async saveSources(sources: ReportSource[]): Promise<void> {
    this.saveAllSync(sources);
  }
}
