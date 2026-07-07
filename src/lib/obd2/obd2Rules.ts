import type { JobPriority, Obd2Dtc, Obd2Snapshot, Obd2SuggestedTask } from '$lib/types/fleet';

export type DtcReferenceEntry = {
  title: string;
  description: string;
  priority?: JobPriority;
  component?: string;
  suggestedTasks?: Obd2SuggestedTask[];
};

export type DtcReference = Record<string, DtcReferenceEntry>;

export function normalizeDtcCode(code: string): string {
  return code.trim().toUpperCase();
}

export function lookupDtc(reference: DtcReference, code: string): DtcReferenceEntry | undefined {
  return reference[normalizeDtcCode(code)];
}

export function enrichDtc(reference: DtcReference, code: string, manualDescription?: string): Obd2Dtc {
  const norm = normalizeDtcCode(code);
  const ref = lookupDtc(reference, norm);
  return {
    code: norm,
    description: ref?.description ?? (manualDescription?.trim() || undefined),
    status: 'confirmed'
  };
}

export function suggestedTasksFromDtcs(reference: DtcReference, codes: string[]): Obd2SuggestedTask[] {
  const tasks: Obd2SuggestedTask[] = [];
  const seen = new Set<string>();
  for (const code of codes) {
    const ref = lookupDtc(reference, code);
    if (!ref) continue;
    const title = ref.title;
    if (seen.has(title)) continue;
    seen.add(title);
    tasks.push({
      title,
      description: ref.description,
      priority: ref.priority,
      component: ref.component
    });
  }
  return tasks;
}

export function createObd2Snapshot(input: {
  vehicleId: string;
  codes: string[];
  reference: DtcReference;
  maintenanceJobId?: string;
  manualDescriptions?: Record<string, string>;
  now?: string;
  id?: string;
}): Obd2Snapshot {
  const capturedAt = input.now ?? new Date().toISOString();
  const dtcs = input.codes.map((c) =>
    enrichDtc(input.reference, c, input.manualDescriptions?.[normalizeDtcCode(c)])
  );
  const suggestedTasks = suggestedTasksFromDtcs(input.reference, input.codes);
  return {
    id: input.id ?? 'obd-' + Math.random().toString(36).slice(2, 11),
    vehicleId: input.vehicleId,
    maintenanceJobId: input.maintenanceJobId,
    capturedAt,
    dtcs,
    suggestedTasks: suggestedTasks.length > 0 ? suggestedTasks : undefined
  };
}

export function linkSnapshotToJob(snapshot: Obd2Snapshot, jobId: string): Obd2Snapshot {
  return { ...snapshot, maintenanceJobId: jobId };
}

export function snapshotSummaryForJob(snapshot: Obd2Snapshot | undefined): string[] {
  if (!snapshot) return [];
  return snapshot.dtcs.map((d) => (d.description ? `${d.code}: ${d.description}` : d.code));
}

export function suggestedPriorityFromSnapshot(
  snapshot: Obd2Snapshot,
  reference: DtcReference
): JobPriority | undefined {
  let best: JobPriority | undefined;
  const rank: Record<JobPriority, number> = { low: 0, medium: 1, high: 2, critical: 3 };
  for (const dtc of snapshot.dtcs) {
    const ref = lookupDtc(reference, dtc.code);
    if (ref?.priority && (!best || rank[ref.priority] > rank[best])) {
      best = ref.priority;
    }
  }
  return best;
}
