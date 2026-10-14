import { ReportSource } from '../../models';

export interface IReportRepository {
  getSources(): Promise<ReportSource[]>;
  updateSource(id: string, updates: Partial<ReportSource>): Promise<ReportSource>;
  saveSources(sources: ReportSource[]): Promise<void>;
}
