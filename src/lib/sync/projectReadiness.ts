import type { EventEnvelope } from './eventTypes';
import { isPmAtRiskFromVehicleNextService } from './pmWindow';
import { foldTransfersMeta, isTransferStale, isVehicleInTransit } from './siteTransferRules';
import { sortEventsForReplay } from './sortEvents';

/** Owner-facing readiness (design doc). */
export type ReadinessClass = 'ready' | 'at-risk' | 'blocked';

export interface VehicleReadinessState {
  vehicleId: string;
  /** Active blocking maintenance (from events). */
  maintenanceBlocked: boolean;
  /** PM / service at-risk signal. */
  pmAtRisk: boolean;
}

/**
 * Fold events into per-vehicle flags, then derive readiness: blocked > at-risk > ready.
 */
export function foldVehicleFlagsFromEvents(events: EventEnvelope[]): Map<string, VehicleReadinessState> {
  const sorted = sortEventsForReplay(events);
  const map = new Map<string, VehicleReadinessState>();

  function ensure(vid: string): VehicleReadinessState {
    let s = map.get(vid);
    if (!s) {
      s = { vehicleId: vid, maintenanceBlocked: false, pmAtRisk: false };
      map.set(vid, s);
    }
    return s;
  }

  for (const e of sorted) {
    const p = e.payload as Record<string, unknown>;
    const vid = typeof p.vehicleId === 'string' ? p.vehicleId : null;
    if (!vid) continue;

    const st = ensure(vid);
    switch (e.event_type) {
      case 'maintenance_blocked':
        st.maintenanceBlocked = true;
        break;
      case 'maintenance_cleared':
        st.maintenanceBlocked = false;
        break;
      case 'pm_risk_set':
        st.pmAtRisk = p.active === true;
        break;
      default:
        break;
    }
  }

  return map;
}

export function readinessClassFromFlags(
  f: VehicleReadinessState,
  options?: { inTransit?: boolean; transferStale?: boolean }
): ReadinessClass {
  if (f.maintenanceBlocked || options?.inTransit || options?.transferStale) return 'blocked';
  if (f.pmAtRisk) return 'at-risk';
  return 'ready';
}

/** Aggregate counts for owner dashboard. */
export function summarizeReadiness(events: EventEnvelope[]): {
  byVehicle: Map<string, ReadinessClass>;
  counts: Record<ReadinessClass, number>;
} {
  const folded = foldVehicleFlagsFromEvents(events);
  const byVehicle = new Map<string, ReadinessClass>();
  const counts: Record<ReadinessClass, number> = { ready: 0, 'at-risk': 0, blocked: 0 };

  for (const [, st] of folded) {
    const c = readinessClassFromFlags(st);
    byVehicle.set(st.vehicleId, c);
    counts[c] += 1;
  }

  return { byVehicle, counts };
}

export interface FleetVehicleMeta {
  id: string;
  nextService?: string;
}

/**
 * Readiness for each fleet vehicle: event projection merged with PM at-risk from `nextService` when no pm_risk event applies.
 */
export function readinessForFleet(
  vehicles: FleetVehicleMeta[],
  cloudEvents: EventEnvelope[]
): { byVehicle: Map<string, ReadinessClass>; counts: Record<ReadinessClass, number> } {
  const folded = foldVehicleFlagsFromEvents(cloudEvents);
  const byVehicle = new Map<string, ReadinessClass>();
  const counts: Record<ReadinessClass, number> = { ready: 0, 'at-risk': 0, blocked: 0 };

  for (const v of vehicles) {
    const base = folded.get(v.id) ?? {
      vehicleId: v.id,
      maintenanceBlocked: false,
      pmAtRisk: false
    };
    let pmAtRisk = base.pmAtRisk;
    if (!pmAtRisk && isPmAtRiskFromVehicleNextService(v.nextService)) {
      pmAtRisk = true;
    }
    const merged = { ...base, pmAtRisk };
    const inTransit = isVehicleInTransit(cloudEvents, v.id);
    const transferState = foldTransfersMeta(cloudEvents, v.id);
    const transferStale =
      inTransit && transferState?.createdAt
        ? isTransferStale(transferState.createdAt)
        : false;
    const c = readinessClassFromFlags(merged, { inTransit, transferStale });
    byVehicle.set(v.id, c);
    counts[c] += 1;
  }

  return { byVehicle, counts };
}
