import { LocalStorageHuddleRepository } from './localStorage/LocalStorageHuddleRepository';
import { LocalStorageActionRepository } from './localStorage/LocalStorageActionRepository';
import { LocalStorageSnapshotRepository } from './localStorage/LocalStorageSnapshotRepository';
import { LocalStorageAuditRepository } from './localStorage/LocalStorageAuditRepository';
import { LocalStorageSettingsRepository } from './localStorage/LocalStorageSettingsRepository';
import { LocalStorageReportRepository } from './localStorage/LocalStorageReportRepository';
import { 
  INITIAL_HUDDLES, 
  INITIAL_ACTIONS, 
  INITIAL_SNAPSHOTS, 
  INITIAL_AUDIT_EVENTS, 
  INITIAL_REPORT_SOURCES, 
  INITIAL_SETTINGS 
} from '../mock-data/seedData';

export const huddleRepository = new LocalStorageHuddleRepository();
export const actionRepository = new LocalStorageActionRepository();
export const snapshotRepository = new LocalStorageSnapshotRepository();
export const auditRepository = new LocalStorageAuditRepository();
export const settingsRepository = new LocalStorageSettingsRepository();
export const reportRepository = new LocalStorageReportRepository();

export async function resetPrototypeData(): Promise<void> {
  await huddleRepository.saveAll(INITIAL_HUDDLES);
  await actionRepository.saveAll(INITIAL_ACTIONS);
  await snapshotRepository.saveAll(INITIAL_SNAPSHOTS);
  await auditRepository.saveAll(INITIAL_AUDIT_EVENTS);
  await reportRepository.saveSources(INITIAL_REPORT_SOURCES);
  await settingsRepository.resetToDefaults();
  
  await auditRepository.log({
    entityType: 'Settings',
    entityId: 'system',
    eventType: 'Reset',
    summary: 'System demo data reset to default seed state',
    performedBy: 'System Administrator',
  });
}

export async function exportPrototypeData(): Promise<string> {
  const huddles = await huddleRepository.getAll();
  const actions = await actionRepository.getAll();
  const snapshots = await snapshotRepository.getAll();
  const audits = await auditRepository.getAll();
  const sources = await reportRepository.getSources();
  const settings = await settingsRepository.getSettings();

  return JSON.stringify({
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    huddles,
    actions,
    snapshots,
    audits,
    sources,
    settings,
  }, null, 2);
}

export async function importPrototypeData(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.huddles || !Array.isArray(data.huddles) || !data.actions || !Array.isArray(data.actions)) {
      return { success: false, message: 'Invalid prototype JSON structure: missing huddles or actions array.' };
    }

    await huddleRepository.saveAll(data.huddles);
    await actionRepository.saveAll(data.actions);
    if (data.snapshots && Array.isArray(data.snapshots)) {
      await snapshotRepository.saveAll(data.snapshots);
    }
    if (data.audits && Array.isArray(data.audits)) {
      await auditRepository.saveAll(data.audits);
    }
    if (data.sources && Array.isArray(data.sources)) {
      await reportRepository.saveSources(data.sources);
    }
    if (data.settings) {
      await settingsRepository.updateSettings(data.settings);
    }

    await auditRepository.log({
      entityType: 'Settings',
      entityId: 'system',
      eventType: 'Updated',
      summary: `Prototype data imported (${data.actions.length} actions, ${data.huddles.length} huddles)`,
      performedBy: 'System Administrator',
    });

    return { success: true, message: `Successfully imported ${data.huddles.length} huddles and ${data.actions.length} actions.` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Failed to parse JSON file: ${errorMsg}` };
  }
}
