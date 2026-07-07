import type { JobStatus, MaintenanceJob, MaintenanceJobHistoryEntry, ServiceType } from '$lib/types/fleet';
import type { ValidationResult } from '$lib/vehicle/vehicleRules';

export type JobCreateInput = {
  vehicleId: string;
  title: string;
  description?: string;
  priority?: MaintenanceJob['priority'];
  serviceType?: ServiceType;
  planned?: boolean;
  component?: string;
  dueDate?: string;
};

const VALID_STATUSES: JobStatus[] = ['open', 'in-progress', 'waiting-parts', 'completed'];

export function validateJobCreate(input: JobCreateInput): ValidationResult {
  if (!input.vehicleId.trim()) {
    return { ok: false, message: 'Vehicle is required.' };
  }
  if (!input.title.trim()) {
    return { ok: false, message: 'Title is required.' };
  }
  return { ok: true };
}

export function createMaintenanceJob(
  input: JobCreateInput,
  now = new Date().toISOString().slice(0, 10)
): MaintenanceJob {
  const status: JobStatus = 'open';
  return {
    id: 'mj-' + Math.random().toString(36).slice(2, 11),
    vehicleId: input.vehicleId.trim(),
    title: input.title.trim(),
    description: input.description?.trim() ?? '',
    priority: input.priority ?? 'medium',
    status,
    createdAt: now,
    updatedAt: now,
    history: [{ date: now, note: 'Job created.', status }],
    planned: input.planned ?? false,
    serviceType: input.serviceType,
    component: input.component?.trim() || undefined,
    dueDate: input.dueDate?.trim() || undefined
  };
}

export function validateStatusTransition(from: JobStatus, to: JobStatus): ValidationResult {
  if (!VALID_STATUSES.includes(to)) {
    return { ok: false, message: `Invalid status: ${to}` };
  }
  if (from === 'completed' && to !== 'completed') {
    return { ok: false, message: 'Completed jobs cannot reopen.' };
  }
  return { ok: true };
}

export function applyJobStatusChange(
  job: MaintenanceJob,
  to: JobStatus,
  now = new Date().toISOString().slice(0, 10)
): MaintenanceJob | { ok: false; message: string } {
  const check = validateStatusTransition(job.status, to);
  if (!check.ok) return check;
  const history: MaintenanceJobHistoryEntry[] = [
    ...job.history,
    { date: now, note: `Status changed to ${to}.`, status: to }
  ];
  return {
    ...job,
    status: to,
    updatedAt: now,
    startedAt: to === 'in-progress' && !job.startedAt ? now : job.startedAt,
    completedAt: to === 'completed' ? now : job.completedAt
  };
}

export function addHistoryNote(
  job: MaintenanceJob,
  note: string,
  now = new Date().toISOString().slice(0, 10)
): MaintenanceJob {
  return {
    ...job,
    updatedAt: now,
    history: [...job.history, { date: now, note: note.trim(), status: job.status }]
  };
}

export function groupJobsByVehicle(
  jobs: MaintenanceJob[],
  vehicleNames: Record<string, string>
): Map<string, MaintenanceJob[]> {
  const map = new Map<string, MaintenanceJob[]>();
  for (const job of jobs) {
    const key = vehicleNames[job.vehicleId] ?? job.vehicleId;
    const list = map.get(key) ?? [];
    list.push(job);
    map.set(key, list);
  }
  return map;
}

export function groupJobsByServiceType(jobs: MaintenanceJob[]): Map<string, MaintenanceJob[]> {
  const map = new Map<string, MaintenanceJob[]>();
  for (const job of jobs) {
    const key = job.serviceType ?? 'other';
    const list = map.get(key) ?? [];
    list.push(job);
    map.set(key, list);
  }
  return map;
}

export function sortJobsTimeline(jobs: MaintenanceJob[]): MaintenanceJob[] {
  return [...jobs].sort((a, b) => {
    const aKey = a.dueDate ?? a.createdAt;
    const bKey = b.dueDate ?? b.createdAt;
    return new Date(aKey).getTime() - new Date(bKey).getTime();
  });
}

export function isOpenJob(job: MaintenanceJob): boolean {
  return job.status !== 'completed';
}
