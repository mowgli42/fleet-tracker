import { STORAGE_CLOUD_EVENTS } from './constants';
import type { EventEnvelope } from './eventTypes';
import { validateSiteKey } from './siteAuth';
import { validateEventEnvelope } from './validateEvent';

/** In-browser "cloud" store: accepted events + idempotency set. */
export interface CloudState {
  events: EventEnvelope[];
  appliedIdempotencyKeys: Set<string>;
}

export type SyncRejectCode = 'invalid_envelope' | 'missing_site_key' | 'unauthorized_site';

export type AcceptResult =
  | { status: 'accepted'; event: EventEnvelope }
  | { status: 'duplicate'; idempotency_key: string }
  | { status: 'rejected'; code: SyncRejectCode; message: string };

/** Parse persisted cloud JSON (`{ events, keys }`) for localStorage, remote API, or demo server file. */
export function parseCloudStatePayload(data: unknown): CloudState {
  if (!data || typeof data !== 'object') return { events: [], appliedIdempotencyKeys: new Set() };
  const p = data as { events?: unknown[]; keys?: string[] };
  const events: EventEnvelope[] = [];
  if (Array.isArray(p.events)) {
    for (const item of p.events) {
      if (validateEventEnvelope(item).ok) events.push(item as EventEnvelope);
    }
  }
  const appliedIdempotencyKeys = new Set(Array.isArray(p.keys) ? p.keys : []);
  return { events, appliedIdempotencyKeys };
}

export function cloudStateToPlain(state: CloudState): { events: EventEnvelope[]; keys: string[] } {
  return { events: state.events, keys: [...state.appliedIdempotencyKeys] };
}

export function loadCloudState(): CloudState {
  if (typeof window === 'undefined') {
    return { events: [], appliedIdempotencyKeys: new Set() };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_CLOUD_EVENTS);
    if (!raw) return { events: [], appliedIdempotencyKeys: new Set() };
    return parseCloudStatePayload(JSON.parse(raw) as unknown);
  } catch {
    return { events: [], appliedIdempotencyKeys: new Set() };
  }
}

export function saveCloudState(state: CloudState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_CLOUD_EVENTS, JSON.stringify(cloudStateToPlain(state)));
}

/**
 * Apply one event to cloud with idempotent dedupe. Assigns event_ts_server when accepted.
 * Site-scoped sync: `auth.siteKey` must match the registry entry for `incoming.site_id`.
 */
export function acceptEventOnCloud(
  state: CloudState,
  incoming: EventEnvelope,
  serverNowIso: string,
  auth: { siteKey: string | null }
): { state: CloudState; result: AcceptResult } {
  const v = validateEventEnvelope(incoming);
  if (!v.ok) {
    return {
      state,
      result: { status: 'rejected', code: 'invalid_envelope', message: v.reason }
    };
  }

  const key = auth.siteKey?.trim() ?? '';
  if (!key) {
    return {
      state,
      result: {
        status: 'rejected',
        code: 'missing_site_key',
        message: 'missing site key for sync ingress'
      }
    };
  }

  if (!validateSiteKey(incoming.site_id, key)) {
    return {
      state,
      result: {
        status: 'rejected',
        code: 'unauthorized_site',
        message: 'site_id and site key do not match'
      }
    };
  }

  if (state.appliedIdempotencyKeys.has(incoming.idempotency_key)) {
    return { state, result: { status: 'duplicate', idempotency_key: incoming.idempotency_key } };
  }

  const applied: EventEnvelope = {
    ...incoming,
    event_ts_server: serverNowIso
  };

  const next: CloudState = {
    events: [...state.events, applied],
    appliedIdempotencyKeys: new Set(state.appliedIdempotencyKeys).add(incoming.idempotency_key)
  };

  return { state: next, result: { status: 'accepted', event: applied } };
}
