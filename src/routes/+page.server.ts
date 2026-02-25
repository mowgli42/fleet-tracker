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
    urgentJobs,
    partsOnOrder
  };
}
