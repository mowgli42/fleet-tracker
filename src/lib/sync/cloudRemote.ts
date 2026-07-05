import { DEMO_SITE_ID, MAX_SYNC_BATCH } from './constants';
import { parseCloudStatePayload, saveCloudState, type CloudState } from './cloudSimulator';
import { loadOutbox, removeFromOutbox } from './outbox';
import { getConfiguredSiteKey } from './siteAuth';

/** Base URL without trailing slash, or null when running 100% in-browser (default). */
export function getRemoteSyncBaseUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const u = import.meta.env.VITE_SYNC_API_URL;
  if (typeof u !== 'string' || !u.trim()) return null;
  return u.trim().replace(/\/$/, '');
}

export async function fetchRemoteCloudState(baseUrl: string): Promise<CloudState | null> {
  const key = getConfiguredSiteKey();
  try {
    const res = await fetch(`${baseUrl}/api/sync/state`, {
      headers: {
        'X-Site-Key': key,
        'X-Site-Id': DEMO_SITE_ID
      }
    });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    return parseCloudStatePayload(json);
  } catch {
    return null;
  }
}

export async function flushOutboxToRemoteCloud(
  baseUrl: string
): Promise<{ processed: number; lastError?: string }> {
  if (typeof window === 'undefined') return { processed: 0 };

  const pending = loadOutbox();
  if (pending.length === 0) return { processed: 0 };

  const batch = pending.slice(0, MAX_SYNC_BATCH);
  const siteKey = getConfiguredSiteKey();
  const siteId = batch[0]?.site_id ?? DEMO_SITE_ID;

  try {
    const res = await fetch(`${baseUrl}/api/sync/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Site-Key': siteKey,
        'X-Site-Id': siteId
      },
      body: JSON.stringify({ events: batch })
    });

    const text = await res.text();
    let body: unknown;
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = null;
    }

    if (!res.ok) {
      let msg = res.statusText;
      if (body && typeof body === 'object' && 'error' in body) {
        const err = (body as { error: unknown }).error;
        if (err && typeof err === 'object' && 'message' in err) {
          const m = (err as { message: unknown }).message;
          if (typeof m === 'string') msg = m;
        }
      } else if (body && typeof body === 'object' && 'message' in body) {
        const m = (body as { message: unknown }).message;
        if (typeof m === 'string') msg = m;
      } else if (text) msg = text.slice(0, 200);
      return { processed: 0, lastError: `remote ${res.status}: ${msg}` };
    }

    if (body && typeof body === 'object' && 'cloud' in body) {
      saveCloudState(parseCloudStatePayload((body as { cloud: unknown }).cloud));
    }

    for (const ev of batch) {
      removeFromOutbox(ev.idempotency_key);
    }

    return { processed: batch.length };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { processed: 0, lastError: msg };
  }
}
