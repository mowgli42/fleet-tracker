import type { Vehicle, MaintenanceJob, PartOrder } from '$lib/types/fleet';
import vehiclesData from '$lib/data/vehicles.json';
import jobsData from '$lib/data/maintenance-jobs.json';
import partsData from '$lib/data/parts-orders.json';

const vehicles = vehiclesData as Vehicle[];
const jobs = jobsData as MaintenanceJob[];
const parts = partsData as PartOrder[];

export function load() {
  const byStatus = vehicles.reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] ?? 0) + 1;
    return acc;
  }, {});

  const openJobs = jobs.filter((j) => j.status !== 'completed');
  const byPriority = openJobs.reduce<Record<string, number>>((acc, j) => {
    acc[j.priority] = (acc[j.priority] ?? 0) + 1;
    return acc;
  }, {});

  const vehicleById = Object.fromEntries(vehicles.map((v) => [v.id, v]));
  const urgentJobs = openJobs
    .filter((j) => j.priority === 'critical' || j.priority === 'high')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)
    .map((j) => ({ ...j, vehicleName: vehicleById[j.vehicleId]?.name ?? j.vehicleId }));

  const partsOnOrder = parts.filter((p) => p.status !== 'received');

  // Fleet availability %: (ready + in-use + reserved) / total
  const availableCount = vehicles.filter(
    (v) => v.status === 'ready' || v.status === 'in-use' || v.status === 'reserved'
  ).length;
  const availabilityPct = vehicles.length ? Math.round((availableCount / vehicles.length) * 100) : 0;

  // Unplanned %: unplanned jobs / all jobs
  const unplannedCount = jobs.filter((j) => !j.planned).length;
  const unplannedPct = jobs.length ? Math.round((unplannedCount / jobs.length) * 100) : 0;

  // MTTR (days): avg repair cycle for completed jobs with completedAt and (startedAt or createdAt)
  const completedWithTime = jobs.filter(
    (j) => j.status === 'completed' && j.completedAt && (j.startedAt || j.createdAt)
  );
  let mttrDays: number | null = null;
  if (completedWithTime.length > 0) {
    const totalDays = completedWithTime.reduce((sum, j) => {
      const end = new Date(j.completedAt!).getTime();
      const start = new Date(j.startedAt || j.createdAt).getTime();
      return sum + (end - start) / (1000 * 60 * 60 * 24);
    }, 0);
    mttrDays = Math.round((totalDays / completedWithTime.length) * 10) / 10;
  }

  // PM compliance: % of completed planned jobs done by due date
  const completedPlanned = jobs.filter((j) => j.status === 'completed' && j.planned && j.dueDate);
  const completedPlannedOnTime = completedPlanned.filter(
    (j) => j.completedAt && new Date(j.completedAt) <= new Date(j.dueDate!)
  );
  const pmCompliancePct =
    completedPlanned.length > 0
      ? Math.round((completedPlannedOnTime.length / completedPlanned.length) * 100)
      : null;

  // Repair trend by component
  const repairTrendByComponent = jobs.reduce<Record<string, number>>((acc, j) => {
    const c = j.component ?? 'other';
    acc[c] = (acc[c] ?? 0) + 1;
    return acc;
  }, {});

  return {
    vehicles,
    jobs,
    parts,
    summary: {
      vehiclesByStatus: byStatus,
      openJobsCount: openJobs.length,
      openJobsByPriority: byPriority,
      partsOnOrderCount: partsOnOrder.length
    },
    availabilityPct,
    unplannedPct,
    mttrDays,
    pmCompliancePct,
    repairTrendByComponent,
    urgentJobs,
    partsOnOrder
  };
}
