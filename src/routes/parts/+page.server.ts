import type { PartOrder, MaintenanceJob, Vehicle } from '$lib/types/fleet';
import partsData from '$lib/data/parts-orders.json';
import jobsData from '$lib/data/maintenance-jobs.json';
import vehiclesData from '$lib/data/vehicles.json';

const parts = partsData as PartOrder[];
const jobs = jobsData as MaintenanceJob[];
const vehicles = vehiclesData as Vehicle[];

const jobById = Object.fromEntries(jobs.map((j) => [j.id, j]));
const vehicleById = Object.fromEntries(vehicles.map((v) => [v.id, v]));

export function load() {
  const partsWithJob = parts.map((p) => {
    const job = p.maintenanceJobId ? jobById[p.maintenanceJobId] : null;
    const vehicleName = job ? vehicleById[job.vehicleId]?.name : null;
    return {
      ...p,
      jobTitle: job?.title,
      vehicleName
    };
  });
  return { parts: partsWithJob };
}
