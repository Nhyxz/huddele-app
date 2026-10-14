import { AppSettings } from '../../models';

export interface ISettingsRepository {
  getSettings(): Promise<AppSettings>;
  updateSettings(updates: Partial<AppSettings>): Promise<AppSettings>;
  resetToDefaults(): Promise<AppSettings>;
}
