import type { MaintenanceJob, Vehicle } from '$lib/types/fleet';
import { PM_AT_RISK_DAYS } from '$lib/sync/constants';
import { daysUntilServiceDate, isPmAtRiskFromVehicleNextService } from '$lib/sync/pmWindow';

export const PM_MILEAGE_WINDOW_MILES = 300;

export function isPmAtRiskFromMileage(
  odometer: number | undefined,
  odometerAtLastService: number | undefined,
  intervalMiles: number | undefined
): boolean {
  if (odometer == null || odometerAtLastService == null || intervalMiles == null) return false;
  const milesSince = odometer - odometerAtLastService;
  const milesUntil = intervalMiles - milesSince;
  return milesUntil >= 0 && milesUntil <= PM_MILEAGE_WINDOW_MILES;
}

export function isVehiclePmAtRisk(
  vehicle: Pick<Vehicle, 'nextService' | 'odometer' | 'odometerAtLastService'>,
  intervalMiles?: number
): boolean {
  if (isPmAtRiskFromVehicleNextService(vehicle.nextService)) return true;
  return isPmAtRiskFromMileage(vehicle.odometer, vehicle.odometerAtLastService, intervalMiles);
}

function isQualifyingPmJob(job: MaintenanceJob): boolean {
  return (
    job.status === 'completed' &&
    job.planned &&
    (job.serviceType === 'oil-change' || job.serviceType === 'fluid-change')
  );
}

/** PM compliance per openspec/specs/pm-scheduling — overdue nextService unless qualifying PM after due. */
export function computePmCompliancePct(
  vehicles: Vehicle[],
  jobs: MaintenanceJob[],
  today = new Date()
): number | null {
  const scheduled = vehicles.filter((v) => v.nextService);
  if (scheduled.length === 0) return null;

  let compliant = 0;
  for (const v of scheduled) {
    const due = new Date(v.nextService!);
    due.setHours(0, 0, 0, 0);
    const todayNorm = new Date(today);
    todayNorm.setHours(0, 0, 0, 0);
    if (due >= todayNorm) {
      compliant += 1;
      continue;
    }
    const fixed = jobs.some(
      (j) =>
        j.vehicleId === v.id &&
        isQualifyingPmJob(j) &&
        j.completedAt &&
        new Date(j.completedAt) > due
    );
    if (fixed) compliant += 1;
  }
  return Math.round((compliant / scheduled.length) * 100);
}

export type PmRiskDelta = { vehicleId: string; active: boolean; nextServiceDueIso?: string } | null;

/** Evaluate whether pm_risk_set should be emitted when crossing the at-risk window. */
export function evaluatePmRiskDelta(
  vehicle: Vehicle,
  wasAtRisk: boolean,
  intervalMiles?: number
): PmRiskDelta {
  const atRisk = isVehiclePmAtRisk(vehicle, intervalMiles);
  if (atRisk === wasAtRisk) return null;
  return {
    vehicleId: vehicle.id,
    active: atRisk,
    nextServiceDueIso: vehicle.nextService
  };
}

export function daysUntilPmDue(nextService?: string): number | null {
  if (!nextService) return null;
  const days = daysUntilServiceDate(nextService);
  return Number.isFinite(days) ? days : null;
}

export { PM_AT_RISK_DAYS };
