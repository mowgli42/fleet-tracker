import { appendLocalEvent } from './localEventLog';
import { acceptEventOnCloud, loadCloudState, saveCloudState } from './cloudSimulator';
import { flushOutboxToRemoteCloud, getRemoteSyncBaseUrl } from './cloudRemote';
import { enqueueOutbox, loadOutbox, removeFromOutbox } from './outbox';
import { getConfiguredSiteKey } from './siteAuth';
import type { EventEnvelope } from './eventTypes';
import { validateEventEnvelope } from './validateEvent';

export function appendAndQueueEvent(event: EventEnvelope): void {
  const v = validateEventEnvelope(event);
  if (!v.ok) throw new Error(`Invalid event: ${v.reason}`);
  appendLocalEvent(event);
  enqueueOutbox(event);
}

/**
 * In-browser cloud only (localStorage). Used when `VITE_SYNC_API_URL` is unset.
 */
export function flushOutboxToLocalCloud(isOnline: boolean): { processed: number; lastError?: string } {
  if (!isOnline || typeof window === 'undefined') return { processed: 0 };

  let state = loadCloudState();
  const pending = loadOutbox();
  let processed = 0;
  const siteKey = getConfiguredSiteKey();

  for (const ev of [...pending]) {
    const serverNow = new Date().toISOString();
    const { state: next, result } = acceptEventOnCloud(state, ev, serverNow, { siteKey });
    if (result.status === 'rejected') {
      return { processed, lastError: `${result.code}: ${result.message}` };
    }
    state = next;
    saveCloudState(state);
    removeFromOutbox(ev.idempotency_key);
    processed++;
  }

  return { processed };
}

/**
 * Push outbox to cloud (remote HTTP when configured, else in-browser store). Safe to call repeatedly when online.
 */
export async function flushOutboxToCloud(isOnline: boolean): Promise<{ processed: number; lastError?: string }> {
  if (!isOnline || typeof window === 'undefined') return { processed: 0 };

  const remote = getRemoteSyncBaseUrl();
  if (remote) return flushOutboxToRemoteCloud(remote);
  return flushOutboxToLocalCloud(isOnline);
}

export function pendingOutboxCount(): number {
  return loadOutbox().length;
}
