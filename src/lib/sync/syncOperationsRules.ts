import type { SyncStatusReport } from './syncStatusReport';

export type ProjectionSource = 'local' | 'cloud';

export function projectionSourceLabel(source: ProjectionSource): string {
  return source === 'local' ? 'local event log' : 'cloud projection';
}

export function projectionSourceDescription(source: ProjectionSource): string {
  return source === 'local' ? 'site view during outage' : 'accepted events + PM rules';
}

export function reportHasOutboxDepth(report: Pick<SyncStatusReport, 'outbox'>): boolean {
  return report.outbox.count >= 0;
}

export function reportShowsLocalLogStats(report: Pick<SyncStatusReport, 'localLog'>): boolean {
  return report.localLog.eventCount >= 0 && report.localLog.approxBytes >= 0;
}

export function shouldShowFlushError(lastFlushError: string | null): boolean {
  return Boolean(lastFlushError?.trim());
}

export function syncBarMetrics(report: {
  pendingOutbox: number;
  cloudAcceptedCount: number;
  cloudOnline: boolean;
}): { pendingOutbox: number; cloudAcceptedCount: number; onlineLabel: string } {
  return {
    pendingOutbox: report.pendingOutbox,
    cloudAcceptedCount: report.cloudAcceptedCount,
    onlineLabel: report.cloudOnline ? 'Online' : 'Offline'
  };
}
