import type { InspectionRecord, MaintenanceJob, Vehicle } from '$lib/types/fleet';

export type HistorySortOrder = 'newest' | 'oldest';

export type VehicleHistoryEntry =
  | { kind: 'job'; job: MaintenanceJob; sortDate: string; isCurrentOpen: boolean }
  | { kind: 'inspection'; inspection: InspectionRecord; sortDate: string };

function jobSortDate(job: MaintenanceJob): string {
  return job.completedAt ?? job.updatedAt ?? job.createdAt;
}

export function buildVehicleHistory(
  vehicleId: string,
  jobs: MaintenanceJob[],
  inspections: InspectionRecord[] = [],
  currentJobId?: string,
  order: HistorySortOrder = 'newest'
): VehicleHistoryEntry[] {
  const entries: VehicleHistoryEntry[] = [
    ...jobs
      .filter((j) => j.vehicleId === vehicleId)
      .map((job) => ({
        kind: 'job' as const,
        job,
        sortDate: jobSortDate(job),
        isCurrentOpen: job.id === currentJobId && job.status !== 'completed'
      })),
    ...inspections
      .filter((i) => i.vehicleId === vehicleId)
      .map((inspection) => ({
        kind: 'inspection' as const,
        inspection,
        sortDate: inspection.inspectedAt
      }))
  ];

  entries.sort((a, b) => {
    const diff = new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime();
    return order === 'newest' ? diff : -diff;
  });
  return entries;
}

export function jobsForVehicleHistory(
  vehicleId: string,
  jobs: MaintenanceJob[],
  order: HistorySortOrder = 'newest'
): MaintenanceJob[] {
  const filtered = jobs.filter((j) => j.vehicleId === vehicleId);
  return [...filtered].sort((a, b) => {
    const diff = new Date(jobSortDate(b)).getTime() - new Date(jobSortDate(a)).getTime();
    return order === 'newest' ? diff : -diff;
  });
}

export function isCurrentOpenJob(job: MaintenanceJob, currentJobId?: string): boolean {
  return Boolean(currentJobId && job.id === currentJobId && job.status !== 'completed');
}

export function odometerDisplayForJob(job: MaintenanceJob): string | null {
  const val = job.odometerAtCompletion ?? job.odometerAtJobOpen;
  return val != null ? String(val) : null;
}
