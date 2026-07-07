import type { FleetArchive, MaintenanceJob, Vehicle } from '$lib/types/fleet';
import type { FleetData } from '$lib/stores/fleetData';

export type BackupSnapshot = {
  exportedAt: string;
  vehicles: Vehicle[];
  jobs: MaintenanceJob[];
  parts: FleetData['parts'];
  events?: unknown[];
};

export function createBackupSnapshot(fleet: FleetData, events: unknown[] = []): BackupSnapshot {
  return {
    exportedAt: new Date().toISOString(),
    vehicles: [...fleet.vehicles],
    jobs: [...fleet.jobs],
    parts: [...fleet.parts],
    events
  };
}

export function restoreFromSnapshot(snapshot: BackupSnapshot): FleetData {
  return {
    vehicles: [...snapshot.vehicles],
    jobs: [...snapshot.jobs],
    parts: [...snapshot.parts],
    obd2Snapshots: [],
    inspections: [],
    defects: [],
    trackingTokens: []
  };
}

export function archiveRetiredVehicle(
  fleet: FleetData,
  vehicleId: string,
  archive: FleetArchive | null,
  now = new Date().toISOString()
): { fleet: FleetData; archive: FleetArchive } {
  const vehicle = fleet.vehicles.find((v) => v.id === vehicleId);
  if (!vehicle) throw new Error('Vehicle not found');
  const vehicleJobs = fleet.jobs.filter((j) => j.vehicleId === vehicleId);
  const nextArchive: FleetArchive = {
    vehicles: [...(archive?.vehicles ?? []), vehicle],
    jobs: [...(archive?.jobs ?? []), ...vehicleJobs],
    archivedAt: now
  };
  return {
    fleet: {
      ...fleet,
      vehicles: fleet.vehicles.filter((v) => v.id !== vehicleId),
      jobs: fleet.jobs.filter((j) => j.vehicleId !== vehicleId)
    },
    archive: nextArchive
  };
}

export function archiveOldCompletedJobs(
  jobs: MaintenanceJob[],
  archive: FleetArchive | null,
  retentionYears: number,
  now = new Date()
): { activeJobs: MaintenanceJob[]; archive: FleetArchive } {
  const cutoff = new Date(now);
  cutoff.setFullYear(cutoff.getFullYear() - retentionYears);
  const activeJobs: MaintenanceJob[] = [];
  const archivedJobs: MaintenanceJob[] = [...(archive?.jobs ?? [])];

  for (const job of jobs) {
    if (job.status === 'completed' && job.completedAt && new Date(job.completedAt) < cutoff) {
      archivedJobs.push(job);
    } else {
      activeJobs.push(job);
    }
  }

  return {
    activeJobs,
    archive: {
      vehicles: archive?.vehicles ?? [],
      jobs: archivedJobs,
      archivedAt: now.toISOString()
    }
  };
}
