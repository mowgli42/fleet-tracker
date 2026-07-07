import type { MaintenanceJob, Vehicle, VehicleStatus } from '$lib/types/fleet';
import type { ValidationResult } from './vehicleRules';

export type VehicleLifecycleInput = {
  driver?: string;
  odometer?: number;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function newJobId(): string {
  return 'mj-' + Math.random().toString(36).slice(2, 11);
}

export function findOpenJobForVehicle(jobs: MaintenanceJob[], vehicleId: string): MaintenanceJob | undefined {
  return jobs.find((j) => j.vehicleId === vehicleId && j.status !== 'completed');
}

export function validateCheckout(driver: string | undefined): ValidationResult {
  if (!driver?.trim()) {
    return { ok: false, message: 'Driver is required for checkout.' };
  }
  return { ok: true };
}

export function validateRelease(hasOpenJob: boolean): ValidationResult {
  if (hasOpenJob) {
    return { ok: false, message: 'Cannot release vehicle while an open maintenance job exists.' };
  }
  return { ok: true };
}

export function intakeVehicle(
  vehicle: Vehicle,
  jobs: MaintenanceJob[],
  input: VehicleLifecycleInput = {}
): { ok: true; vehicle: Vehicle; job: MaintenanceJob } | { ok: false; message: string } {
  const now = todayIso();
  const odometer = input.odometer ?? vehicle.odometer;
  const job: MaintenanceJob = {
    id: newJobId(),
    vehicleId: vehicle.id,
    title: 'Intake – maintenance',
    description: 'Vehicle brought in for maintenance.',
    priority: 'medium',
    status: 'open',
    createdAt: now,
    updatedAt: now,
    history: [{ date: now, note: 'Vehicle intake.', status: 'open' }],
    planned: false,
    odometerAtJobOpen: odometer
  };
  const updatedVehicle: Vehicle = {
    ...vehicle,
    status: 'maintenance',
    intakeAt: now,
    currentJobId: job.id,
    odometer: odometer ?? vehicle.odometer
  };
  return { ok: true, vehicle: updatedVehicle, job };
}

export function checkoutVehicle(
  vehicle: Vehicle,
  driver: string
): { ok: true; vehicle: Vehicle } | { ok: false; message: string } {
  const check = validateCheckout(driver);
  if (!check.ok) return check;
  const now = todayIso();
  return {
    ok: true,
    vehicle: {
      ...vehicle,
      status: 'in-use',
      driver: driver.trim(),
      checkedOutAt: now,
      currentJobId: undefined
    }
  };
}

export function releaseVehicle(
  vehicle: Vehicle,
  jobs: MaintenanceJob[]
): { ok: true; vehicle: Vehicle } | { ok: false; message: string } {
  const openJob = findOpenJobForVehicle(jobs, vehicle.id);
  const check = validateRelease(Boolean(openJob));
  if (!check.ok) return check;
  const now = todayIso();
  return {
    ok: true,
    vehicle: {
      ...vehicle,
      status: 'ready',
      releasedAt: now,
      currentJobId: undefined
    }
  };
}

export function validateDirectStatusEdit(
  status: VehicleStatus,
  driver: string | undefined,
  jobs: MaintenanceJob[],
  vehicleId: string
): ValidationResult {
  const openJob = findOpenJobForVehicle(jobs, vehicleId);
  if (status === 'in-use' && !driver?.trim()) {
    return { ok: false, message: 'Driver is required when status is in-use.' };
  }
  if (status === 'ready' && openJob) {
    return { ok: false, message: 'Cannot release vehicle while an open maintenance job exists.' };
  }
  return { ok: true };
}
