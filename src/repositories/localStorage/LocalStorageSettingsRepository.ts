import { AppSettings } from '../../models';
import { ISettingsRepository } from '../interfaces/ISettingsRepository';
import { INITIAL_SETTINGS } from '../../mock-data/seedData';

const STORAGE_KEY = 'ed_huddle_data_settings';

export class LocalStorageSettingsRepository implements ISettingsRepository {
  private getStored(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        this.saveSync(INITIAL_SETTINGS);
        return INITIAL_SETTINGS;
      }
      return JSON.parse(data) as AppSettings;
    } catch {
      return INITIAL_SETTINGS;
    }
  }

  private saveSync(settings: AppSettings): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  async getSettings(): Promise<AppSettings> {
    return this.getStored();
  }

  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    const current = this.getStored();
    const updated: AppSettings = {
      ...current,
      ...updates,
    };
    this.saveSync(updated);
    return updated;
  }

  async resetToDefaults(): Promise<AppSettings> {
    this.saveSync(INITIAL_SETTINGS);
    return INITIAL_SETTINGS;
  }
}
