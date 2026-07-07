import type { MaintenanceJob, Vehicle } from '$lib/types/fleet';
import { filterVehicles } from '$lib/vehicle/vehicleRules';
import { intakeVehicle } from '$lib/vehicle/vehicleLifecycleRules';
import { createMaintenanceJob } from '$lib/maintenance/maintenanceJobRules';

export const INTAKE_STEPS = ['identify', 'inspect', 'follow-up'] as const;
export type IntakeStep = (typeof INTAKE_STEPS)[number];

export type IntakeChecklist = {
  tires: boolean;
  lights: boolean;
  fluids: boolean;
  brakes: boolean;
  body: boolean;
};

export const CRITICAL_CHECKLIST_KEYS: (keyof IntakeChecklist)[] = ['brakes', 'tires'];

export function searchVehiclesForIntake(vehicles: Vehicle[], query: string): Vehicle[] {
  return filterVehicles(vehicles, { query });
}

export function incompleteCriticalChecklist(checklist: IntakeChecklist): string[] {
  const labels: Record<keyof IntakeChecklist, string> = {
    tires: 'Tires',
    lights: 'Lights',
    fluids: 'Fluids',
    brakes: 'Brakes',
    body: 'Body / glass'
  };
  return CRITICAL_CHECKLIST_KEYS.filter((k) => !checklist[k]).map((k) => labels[k]);
}

export function completeTabletIntake(input: {
  vehicle: Vehicle;
  jobs: MaintenanceJob[];
  checklist: IntakeChecklist;
  flagMaintenance: boolean;
  issueTitle?: string;
  pullForService: boolean;
  now?: string;
}): {
  vehicle: Vehicle;
  jobs: MaintenanceJob[];
  warnings: string[];
} {
  const warnings = incompleteCriticalChecklist(input.checklist);
  const now = input.now ?? new Date().toISOString().slice(0, 10);
  let vehicle = input.vehicle;
  let jobs = [...input.jobs];

  if (input.pullForService && input.flagMaintenance && input.issueTitle?.trim()) {
    const job = createMaintenanceJob(
      {
        vehicleId: vehicle.id,
        title: input.issueTitle.trim(),
        serviceType: 'inspection',
        planned: false,
        component: 'other'
      },
      now
    );
    job.description = 'Reported during tablet intake inspection.';
    job.history = [{ date: now, note: 'Opened from intake workflow.', status: 'open' }];
    jobs.push(job);
    vehicle = {
      ...vehicle,
      status: 'maintenance',
      intakeAt: now,
      currentJobId: job.id
    };
  } else if (input.pullForService) {
    const intake = intakeVehicle(vehicle, jobs, {});
    if (intake.ok) {
      vehicle = intake.vehicle;
      jobs.push(intake.job);
    }
  } else if (input.flagMaintenance && input.issueTitle?.trim()) {
    const job = createMaintenanceJob(
      {
        vehicleId: vehicle.id,
        title: input.issueTitle.trim(),
        serviceType: 'inspection',
        planned: false
      },
      now
    );
    jobs.push(job);
  } else {
    vehicle = { ...vehicle, intakeAt: vehicle.intakeAt ?? now };
  }

  return { vehicle, jobs, warnings };
}

export function intakeStepIndex(step: number): number {
  return Math.max(0, Math.min(INTAKE_STEPS.length - 1, step - 1));
}
