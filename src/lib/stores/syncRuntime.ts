import { get, writable } from 'svelte/store';
import { DEMO_SITE_KEY, STORAGE_CLOUD_ONLINE, STORAGE_SITE_KEY } from '$lib/sync/constants';
import { fetchRemoteCloudState, getRemoteSyncBaseUrl } from '$lib/sync/cloudRemote';
import { loadCloudState, saveCloudState } from '$lib/sync/cloudSimulator';
import {
  createFlushBackoffState,
  recordFlushFailure,
  recordFlushSuccess,
  shouldAttemptFlush,
  type FlushBackoffState
} from '$lib/sync/flushBackoff';
import { loadLocalEvents } from '$lib/sync/localEventLog';
import { flushOutboxToCloud, pendingOutboxCount } from '$lib/sync/syncPipeline';
import { readinessForFleet } from '$lib/sync/projectReadiness';
import { fleetDataStore } from './fleetData';

export type ProjectionSource = 'local' | 'cloud';

export type SyncSnapshot = {
  online: boolean;
  pendingOutbox: number;
  cloudAcceptedCount: number;
  localEventCount: number;
  projectionSource: ProjectionSource;
  readiness: { ready: number; 'at-risk': number; blocked: number };
  /** ISO timestamp of last refresh (flush + projection recompute). */
  lastUpdatedAt: string | null;
  /** True when `VITE_SYNC_API_URL` is set (build-time). */
  remoteSync: boolean;
  lastFlushError: string | null;
};

let flushBackoff: FlushBackoffState = createFlushBackoffState();

/** Test hook: reset backoff between unit tests. */
export function resetFlushBackoffForTests(): void {
  flushBackoff = createFlushBackoffState();
}

export const cloudOnline = writable(true);

export const syncSnapshot = writable<SyncSnapshot>({
  online: true,
  pendingOutbox: 0,
  cloudAcceptedCount: 0,
  localEventCount: 0,
  projectionSource: 'cloud',
  readiness: { ready: 0, 'at-risk': 0, blocked: 0 },
  lastUpdatedAt: null,
  remoteSync: false,
  lastFlushError: null
});

export async function refreshSyncSnapshot(): Promise<void> {
  if (typeof window === 'undefined') return;
  const online = get(cloudOnline);
  const remote = getRemoteSyncBaseUrl();
  let flush = { processed: 0, lastError: undefined as string | undefined };

  if (online && shouldAttemptFlush(flushBackoff)) {
    flush = await flushOutboxToCloud(online);
    flushBackoff = flush.lastError ? recordFlushFailure(flushBackoff) : recordFlushSuccess();
  }

  let cloud = loadCloudState();

  if (remote && online) {
    const fresh = await fetchRemoteCloudState(remote);
    if (fresh) {
      saveCloudState(fresh);
      cloud = fresh;
    }
  }

  const localEvents = loadLocalEvents();
  const projectionSource: ProjectionSource = online ? 'cloud' : 'local';
  const eventsForReadiness = online ? cloud.events : localEvents;

  const fleet = get(fleetDataStore);
  const vehicles = fleet.vehicles.map((v) => ({ id: v.id, nextService: v.nextService }));
  const { counts } = readinessForFleet(vehicles, eventsForReadiness);
  syncSnapshot.set({
    online,
    pendingOutbox: pendingOutboxCount(),
    cloudAcceptedCount: cloud.events.length,
    localEventCount: localEvents.length,
    projectionSource,
    readiness: counts,
    lastUpdatedAt: new Date().toISOString(),
    remoteSync: Boolean(remote),
    lastFlushError: flush.lastError ?? null
  });
}

export function initSyncRuntime(): void {
  if (typeof window === 'undefined') return;
  const stored = window.localStorage.getItem(STORAGE_CLOUD_ONLINE);
  cloudOnline.set(stored !== 'false');
  if (window.localStorage.getItem(STORAGE_SITE_KEY) == null) {
    window.localStorage.setItem(STORAGE_SITE_KEY, DEMO_SITE_KEY);
  }
  void refreshSyncSnapshot();
  setInterval(() => {
    void refreshSyncSnapshot();
  }, 2500);
}

export function setCloudOnline(online: boolean): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_CLOUD_ONLINE, online ? 'true' : 'false');
  }
  cloudOnline.set(online);
  void refreshSyncSnapshot();
}
