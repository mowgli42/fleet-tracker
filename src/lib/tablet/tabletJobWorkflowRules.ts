import type { MaintenanceJob, PartOrder } from '$lib/types/fleet';

export const RTS_CHECKLIST_KEYS = [
  'postRepairInspection',
  'fluidsVerified',
  'torqueSafety',
  'testDrive',
  'paperworkKeys'
] as const;

export type RtsChecklist = Record<(typeof RTS_CHECKLIST_KEYS)[number], boolean>;

export function emptyRtsChecklist(): RtsChecklist {
  return {
    postRepairInspection: false,
    fluidsVerified: false,
    torqueSafety: false,
    testDrive: false,
    paperworkKeys: false
  };
}

export function isRtsChecklistComplete(checklist: RtsChecklist): boolean {
  return RTS_CHECKLIST_KEYS.every((k) => checklist[k]);
}

export function partsCompleteForJob(parts: PartOrder[], jobId: string): boolean {
  const linked = parts.filter((p) => p.maintenanceJobId === jobId);
  if (linked.length === 0) return true;
  return linked.every((p) => p.status === 'received');
}

export function canStartShopWork(
  job: MaintenanceJob,
  parts: PartOrder[],
  partsOverride: boolean
): boolean {
  if (job.status === 'completed' || job.status === 'in-progress') return false;
  return partsCompleteForJob(parts, job.id) || partsOverride;
}

export function canCompleteReturnToService(job: MaintenanceJob, checklist: RtsChecklist): boolean {
  return job.status === 'in-progress' && isRtsChecklistComplete(checklist);
}

export function workflowStepIndex(job: MaintenanceJob, pane: number): number {
  if (job.status === 'completed') return 2;
  return Math.max(0, Math.min(2, pane));
}

export function unreceivedPartsWarning(parts: PartOrder[], jobId: string): boolean {
  const linked = parts.filter((p) => p.maintenanceJobId === jobId);
  return linked.some((p) => p.status !== 'received');
}
