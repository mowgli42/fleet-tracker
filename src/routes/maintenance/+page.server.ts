import type { MaintenanceJob, Vehicle } from '$lib/types/fleet';
import jobsData from '$lib/data/maintenance-jobs.json';
import vehiclesData from '$lib/data/vehicles.json';

const jobs = jobsData as MaintenanceJob[];
const vehicles = vehiclesData as Vehicle[];

const vehicleById = Object.fromEntries(vehicles.map((v) => [v.id, v]));

export function load() {
  const jobsWithVehicle = jobs.map((j) => ({
    ...j,
    vehicleName: vehicleById[j.vehicleId]?.name ?? j.vehicleId
  }));
  return { jobs: jobsWithVehicle, vehicles };
}
