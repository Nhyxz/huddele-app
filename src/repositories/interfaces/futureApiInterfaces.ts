import { IHuddleRepository } from './IHuddleRepository';
import { IActionRepository } from './IActionRepository';
import { ISnapshotRepository } from './ISnapshotRepository';
import { IReportRepository } from './IReportRepository';

/**
 * Placeholder interface for future server-side or Cloud API integration
 * (e.g. NHS Trust API, Microsoft Dataverse, SharePoint Lists, or Azure SQL).
 * Not implemented in this local prototype.
 */
export interface ApiHuddleRepository extends IHuddleRepository {
  apiEndpoint?: string;
  authToken?: string;
}

/**
 * Placeholder interface for future server-side Action repository
 */
export interface ApiActionRepository extends IActionRepository {
  apiEndpoint?: string;
  syncWithEpr?: boolean;
}

/**
 * Placeholder interface for future server-side Snapshot repository
 */
export interface ApiSnapshotRepository extends ISnapshotRepository {
  apiEndpoint?: string;
}

/**
 * Placeholder interface for future server-side Reporting & Multi-source telemetry
 */
export interface ApiReportRepository extends IReportRepository {
  cadOnlineEndpoint?: string;
  cernerFhirEndpoint?: string;
}
