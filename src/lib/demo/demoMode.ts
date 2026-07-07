import { FLEET_DATA_STORAGE_KEY } from '$lib/stores/fleetData';
import {
  STORAGE_CAUSAL,
  STORAGE_CLOUD_EVENTS,
  STORAGE_CLOUD_ONLINE,
  STORAGE_LOCAL_EVENTS,
  STORAGE_OUTBOX,
  STORAGE_SITE_KEY
} from '$lib/sync/constants';

export const DEMO_DAY_STORAGE_KEY = 'fleet-demo-day-v1';

/** All localStorage keys cleared when the demo resets (fleet + sync simulation). */
export const DEMO_CLEARABLE_STORAGE_KEYS = [
  FLEET_DATA_STORAGE_KEY,
  STORAGE_LOCAL_EVENTS,
  STORAGE_CLOUD_EVENTS,
  STORAGE_OUTBOX,
  STORAGE_CAUSAL,
  STORAGE_CLOUD_ONLINE,
  STORAGE_SITE_KEY
] as const;

export function isDemoMode(): boolean {
  return import.meta.env.VITE_DEMO_MODE === 'true';
}

/** UTC calendar day `YYYY-MM-DD` used for per-browser daily reset. */
export function getUtcDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function clearDemoStorage(): void {
  if (typeof window === 'undefined') return;
  for (const key of DEMO_CLEARABLE_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }
}

/**
 * When demo mode is on, clear persisted state if the UTC day rolled over.
 * Returns true when storage was cleared for a new demo day.
 */
export function bootstrapDemoIfNeeded(now = new Date()): boolean {
  if (!isDemoMode() || typeof window === 'undefined') return false;

  const today = getUtcDayKey(now);
  const storedDay = window.localStorage.getItem(DEMO_DAY_STORAGE_KEY);
  if (storedDay === today) return false;

  clearDemoStorage();
  window.localStorage.setItem(DEMO_DAY_STORAGE_KEY, today);
  return true;
}

/** Manual reset: wipe demo storage and reload so seed JSON is applied again. */
export function resetDemo(): void {
  if (typeof window === 'undefined') return;
  clearDemoStorage();
  if (isDemoMode()) {
    window.localStorage.setItem(DEMO_DAY_STORAGE_KEY, getUtcDayKey());
  }
  window.location.reload();
}
