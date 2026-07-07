import type { EventEnvelope } from './eventTypes';
import { sortEventsForReplay } from './sortEvents';

export const TRANSFER_STALE_DAYS = 7;

export interface TransferState {
  vehicleId: string;
  fromSiteId: string;
  toSiteId: string;
  transferId: string;
  createdAt: string;
  applied: boolean;
}

export function foldTransfersFromEvents(events: EventEnvelope[]): Map<string, TransferState> {
  const sorted = sortEventsForReplay(events);
  const map = new Map<string, TransferState>();

  for (const e of sorted) {
    const p = e.payload as Record<string, unknown>;
    const vehicleId = typeof p.vehicleId === 'string' ? p.vehicleId : null;
    if (!vehicleId) continue;

    if (e.event_type === 'transfer_created') {
      map.set(vehicleId, {
        vehicleId,
        fromSiteId: String(p.fromSiteId ?? ''),
        toSiteId: String(p.toSiteId ?? ''),
        transferId: String(p.transferId ?? e.entity_id),
        createdAt: e.event_ts_local,
        applied: false
      });
    } else if (e.event_type === 'transfer_applied') {
      map.delete(vehicleId);
    }
  }
  return map;
}

export function transferStateForVehicle(
  events: EventEnvelope[],
  vehicleId: string
): TransferState | undefined {
  return foldTransfersFromEvents(events).get(vehicleId);
}

/** @deprecated alias for transferStateForVehicle */
export function foldTransfersMeta(
  events: EventEnvelope[],
  vehicleId: string
): { createdAt: string } | undefined {
  const s = transferStateForVehicle(events, vehicleId);
  if (!s) return undefined;
  return { createdAt: s.createdAt };
}

export function isVehicleInTransit(events: EventEnvelope[], vehicleId: string): boolean {
  const state = foldTransfersFromEvents(events).get(vehicleId);
  return Boolean(state && !state.applied);
}

export function isTransferStale(createdAtIso: string, now = new Date(), slaDays = TRANSFER_STALE_DAYS): boolean {
  const created = new Date(createdAtIso);
  if (Number.isNaN(created.getTime())) return false;
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > slaDays;
}

export function createTransferPayload(input: {
  vehicleId: string;
  fromSiteId: string;
  toSiteId: string;
  transferId: string;
}): Record<string, unknown> {
  return {
    vehicleId: input.vehicleId,
    fromSiteId: input.fromSiteId,
    toSiteId: input.toSiteId,
    transferId: input.transferId
  };
}

/** Idempotent apply: returns true if this transfer_id was not yet applied. */
export function shouldApplyTransfer(
  events: EventEnvelope[],
  transferId: string,
  idempotencyKey: string
): boolean {
  const sorted = sortEventsForReplay(events);
  const applied = sorted.some(
    (e) =>
      e.event_type === 'transfer_applied' &&
      (e.payload as Record<string, unknown>).transferId === transferId
  );
  if (applied) return false;
  const duplicate = sorted.filter((e) => e.idempotency_key === idempotencyKey).length > 1;
  return !duplicate;
}
