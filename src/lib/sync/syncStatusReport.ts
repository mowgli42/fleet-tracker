import { get } from 'svelte/store';
import { fleetDataStore } from '$lib/stores/fleetData';
import { syncSnapshot } from '$lib/stores/syncRuntime';
import {
  DEMO_SITE_ID,
  STORAGE_CAUSAL,
  STORAGE_CLOUD_EVENTS,
  STORAGE_LOCAL_EVENTS,
  STORAGE_OUTBOX
} from './constants';
import { loadCloudState } from './cloudSimulator';
import type { EventEnvelope } from './eventTypes';
import { loadLocalEvents } from './localEventLog';
import { loadOutbox } from './outbox';
import { readinessForFleet } from './projectReadiness';

export type SyncStatusReport = {
  siteId: string;
  localLog: {
    eventCount: number;
    approxBytes: number;
    oldestLocalTs: string | null;
    newestLocalTs: string | null;
    storageKey: string;
  };
  outbox: {
    count: number;
    preview: Array<{ event_type: string; entity_id: string; idempotency_key: string }>;
  };
  cloud: {
    acceptedEventCount: number;
    idempotencyKeysApplied: number;
    lastServerTs: string | null;
    approxBytes: number;
    storageKey: string;
  };
  projection: {
    ready: number;
    atRisk: number;
    blocked: number;
  };
  storageKeys: Array<{ key: string; approxBytes: number }>;
  remoteSync: boolean;
  lastFlushError: string | null;
};

function localStorageApproxBytes(key: string): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(key);
  return raw ? raw.length * 2 : 0;
}

function tsRangeLocal(events: EventEnvelope[]): { oldest: string | null; newest: string | null } {
  if (events.length === 0) return { oldest: null, newest: null };
  const sorted = [...events].sort((a, b) => a.event_ts_local.localeCompare(b.event_ts_local));
  return { oldest: sorted[0].event_ts_local, newest: sorted[sorted.length - 1].event_ts_local };
}

function maxServerTs(events: EventEnvelope[]): string | null {
  let max: string | null = null;
  for (const e of events) {
    const t = e.event_ts_server;
    if (t && (!max || t > max)) max = t;
  }
  return max;
}

/**
 * Aggregates local log, outbox, cloud simulator, and projection for the sync status UI.
 * Safe to call on the client only (uses localStorage + fleet store).
 */
export function buildSyncStatusReport(): SyncStatusReport {
  const snap = get(syncSnapshot);
  const localEvents = loadLocalEvents();
  const outbox = loadOutbox();
  const cloud = loadCloudState();
  const fleet = get(fleetDataStore);
  const vehicles = fleet.vehicles.map((v) => ({ id: v.id, nextService: v.nextService }));
  const { counts } = readinessForFleet(vehicles, cloud.events);
  const range = tsRangeLocal(localEvents);

  const preview = outbox.slice(0, 12).map((e) => ({
    event_type: e.event_type,
    entity_id: e.entity_id,
    idempotency_key: e.idempotency_key
  }));

  const storageKeys = [STORAGE_LOCAL_EVENTS, STORAGE_CLOUD_EVENTS, STORAGE_OUTBOX, STORAGE_CAUSAL].map((key) => ({
    key,
    approxBytes: localStorageApproxBytes(key)
  }));

  return {
    siteId: DEMO_SITE_ID,
    localLog: {
      eventCount: localEvents.length,
      approxBytes: localStorageApproxBytes(STORAGE_LOCAL_EVENTS),
      oldestLocalTs: range.oldest,
      newestLocalTs: range.newest,
      storageKey: STORAGE_LOCAL_EVENTS
    },
    outbox: {
      count: outbox.length,
      preview
    },
    cloud: {
      acceptedEventCount: cloud.events.length,
      idempotencyKeysApplied: cloud.appliedIdempotencyKeys.size,
      lastServerTs: maxServerTs(cloud.events),
      approxBytes: localStorageApproxBytes(STORAGE_CLOUD_EVENTS),
      storageKey: STORAGE_CLOUD_EVENTS
    },
    projection: {
      ready: counts.ready,
      atRisk: counts['at-risk'],
      blocked: counts.blocked
    },
    storageKeys,
    remoteSync: snap.remoteSync,
    lastFlushError: snap.lastFlushError
  };
}
