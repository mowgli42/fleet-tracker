import { SITES, type SiteInfo } from '$lib/data/multiSiteDemo';
import type { MaintenanceJob, Vehicle } from '$lib/types/fleet';

export const HOUR_MS = 60 * 60 * 1000;

export type HorizonHours = 24 | 48 | 72;

export type ScheduleKind =
  | 'available'
  | 'assigned'
  | 'scheduled_maint'
  | 'relocation'
  | 'unscheduled_maint';

export const SCHEDULE_LEGEND: { kind: ScheduleKind; label: string; className: string }[] = [
  { kind: 'available', label: 'Available', className: 'sched-available' },
  { kind: 'assigned', label: 'Assigned', className: 'sched-assigned' },
  { kind: 'scheduled_maint', label: 'Scheduled maintenance', className: 'sched-scheduled' },
  { kind: 'relocation', label: 'Relocation', className: 'sched-relocation' },
  { kind: 'unscheduled_maint', label: 'Unscheduled maintenance', className: 'sched-unscheduled' }
];

export type ScheduleSegment = {
  kind: ScheduleKind;
  startMs: number;
  endMs: number;
  label: string;
  jobId?: string;
  assignedTo?: string;
};

export type VehicleScheduleRow = {
  vehicleId: string;
  name: string;
  siteId: string;
  siteName: string;
  nextLabel: string;
  canDeferScheduled: boolean;
  segments: ScheduleSegment[];
};

export type SiteScheduleGroup = {
  siteId: string;
  siteName: string;
  vehicles: VehicleScheduleRow[];
};

function clip(seg: ScheduleSegment, windowStart: number, windowEnd: number): ScheduleSegment | null {
  const startMs = Math.max(seg.startMs, windowStart);
  const endMs = Math.min(seg.endMs, windowEnd);
  if (endMs <= startMs) return null;
  return { ...seg, startMs, endMs };
}

function fillGaps(blocks: ScheduleSegment[], windowStart: number, windowEnd: number): ScheduleSegment[] {
  const sorted = [...blocks].sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
  const out: ScheduleSegment[] = [];
  let cursor = windowStart;
  for (const block of sorted) {
    if (block.startMs > cursor) {
      out.push({ kind: 'available', startMs: cursor, endMs: block.startMs, label: 'Available' });
    }
    if (block.endMs > cursor) {
      out.push({ ...block, startMs: Math.max(block.startMs, cursor) });
      cursor = block.endMs;
    }
  }
  if (cursor < windowEnd) {
    out.push({ kind: 'available', startMs: cursor, endMs: windowEnd, label: 'Available' });
  }
  return out;
}

function openJobsFor(vehicleId: string, jobs: MaintenanceJob[]): MaintenanceJob[] {
  return jobs.filter((j) => j.vehicleId === vehicleId && j.status !== 'completed');
}

function unscheduledHours(job: MaintenanceJob): number {
  if (job.status === 'waiting-parts') return 18;
  if (job.laborHoursActual && job.laborHoursActual > 0) {
    return Math.min(24, Math.max(4, job.laborHoursActual * 2));
  }
  return 10;
}

function siteForVehicle(vehicleId: string, sites: SiteInfo[]): SiteInfo {
  return sites.find((s) => s.vehicleIds.includes(vehicleId)) ?? {
    id: 'unassigned',
    name: 'Unassigned',
    region: '',
    vehicleIds: []
  };
}

function nextLabel(segments: ScheduleSegment[]): string {
  const first = segments.find((s) => s.kind !== 'available');
  return first?.label ?? 'Available';
}

function hasDeferOpportunity(segments: ScheduleSegment[]): boolean {
  const unscheduledEnd = segments.find((s) => s.kind === 'unscheduled_maint')?.endMs;
  if (unscheduledEnd == null) return false;
  return segments.some((s) => s.kind === 'scheduled_maint' && s.startMs >= unscheduledEnd);
}

/** Project a vehicle's current status + open jobs onto a rolling now–horizon window. */
export function buildVehicleSchedule(
  vehicle: Vehicle,
  jobs: MaintenanceJob[],
  nowMs: number,
  horizonHours: HorizonHours
): VehicleScheduleRow {
  const windowEnd = nowMs + horizonHours * HOUR_MS;
  const open = openJobsFor(vehicle.id, jobs);
  const unplanned = open.filter((j) => !j.planned);
  const planned = open.filter((j) => j.planned);
  const blocks: ScheduleSegment[] = [];

  let occupiedUntil = nowMs;

  if (vehicle.status === 'out-of-service' && unplanned.length === 0) {
    blocks.push({
      kind: 'unscheduled_maint',
      startMs: nowMs,
      endMs: windowEnd,
      label: 'Out of service'
    });
    occupiedUntil = windowEnd;
  }

  for (const job of unplanned) {
    const hours = vehicle.status === 'out-of-service' ? horizonHours : unscheduledHours(job);
    const endMs = Math.min(windowEnd, nowMs + hours * HOUR_MS);
    blocks.push({
      kind: 'unscheduled_maint',
      startMs: nowMs,
      endMs,
      label: job.title,
      jobId: job.id,
      assignedTo: job.assignedTo
    });
    occupiedUntil = Math.max(occupiedUntil, endMs);
  }

  if (unplanned.length === 0 && vehicle.status === 'maintenance') {
    const endMs = Math.min(windowEnd, nowMs + 12 * HOUR_MS);
    blocks.push({
      kind: 'unscheduled_maint',
      startMs: nowMs,
      endMs,
      label: 'In shop',
      jobId: vehicle.currentJobId
    });
    occupiedUntil = Math.max(occupiedUntil, endMs);
  }

  if (unplanned.length === 0 && vehicle.status === 'in-use') {
    const endMs = Math.min(windowEnd, nowMs + 8 * HOUR_MS);
    blocks.push({
      kind: 'assigned',
      startMs: nowMs,
      endMs,
      label: vehicle.driver ? `Assigned · ${vehicle.driver}` : 'Assigned'
    });
    occupiedUntil = Math.max(occupiedUntil, endMs);
  }

  if (unplanned.length === 0 && vehicle.status === 'reserved') {
    const endMs = Math.min(windowEnd, nowMs + 6 * HOUR_MS);
    blocks.push({
      kind: 'relocation',
      startMs: nowMs,
      endMs,
      label: 'Relocation'
    });
    occupiedUntil = Math.max(occupiedUntil, endMs);
  }

  for (const job of planned) {
    const durationMs = 4 * HOUR_MS;
    const dueMs = job.dueDate ? Date.parse(job.dueDate) : Number.NaN;
    let startMs =
      Number.isFinite(dueMs) && dueMs >= nowMs && dueMs < windowEnd - durationMs
        ? dueMs
        : nowMs + 30 * HOUR_MS;
    if (startMs < occupiedUntil + 2 * HOUR_MS) {
      startMs = occupiedUntil + 2 * HOUR_MS;
    }
    const endMs = Math.min(windowEnd, startMs + durationMs);
    if (endMs > startMs && startMs < windowEnd) {
      blocks.push({
        kind: 'scheduled_maint',
        startMs,
        endMs,
        label: job.title,
        jobId: job.id,
        assignedTo: job.assignedTo
      });
    }
  }

  const clipped = blocks
    .map((b) => clip(b, nowMs, windowEnd))
    .filter((b): b is ScheduleSegment => b != null);
  const segments = fillGaps(clipped, nowMs, windowEnd);
  const site = siteForVehicle(vehicle.id, SITES);

  return {
    vehicleId: vehicle.id,
    name: vehicle.name,
    siteId: site.id,
    siteName: site.name,
    nextLabel: nextLabel(segments),
    canDeferScheduled: hasDeferOpportunity(segments),
    segments
  };
}

export function buildFleetSchedule(
  vehicles: Vehicle[],
  jobs: MaintenanceJob[],
  nowMs: number,
  horizonHours: HorizonHours,
  sites: SiteInfo[] = SITES
): SiteScheduleGroup[] {
  const rows = vehicles.map((v) => buildVehicleSchedule(v, jobs, nowMs, horizonHours));
  const bySite = new Map<string, SiteScheduleGroup>();
  for (const site of sites) {
    bySite.set(site.id, { siteId: site.id, siteName: site.name, vehicles: [] });
  }
  bySite.set('unassigned', { siteId: 'unassigned', siteName: 'Unassigned', vehicles: [] });

  for (const row of rows) {
    const group = bySite.get(row.siteId) ?? bySite.get('unassigned');
    if (group) group.vehicles.push(row);
  }

  return [...bySite.values()].filter((g) => g.vehicles.length > 0);
}

export function segmentOffsetPct(startMs: number, nowMs: number, horizonHours: HorizonHours): number {
  return ((startMs - nowMs) / (horizonHours * HOUR_MS)) * 100;
}

export function segmentWidthPct(startMs: number, endMs: number, horizonHours: HorizonHours): number {
  return ((endMs - startMs) / (horizonHours * HOUR_MS)) * 100;
}
