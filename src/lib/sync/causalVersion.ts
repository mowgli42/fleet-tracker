import { STORAGE_CAUSAL } from './constants';
import type { EntityType } from './eventTypes';

type Store = Record<string, number>;

function key(entityType: EntityType, entityId: string): string {
  return `${entityType}:${entityId}`;
}

export function loadCausalStore(): Store {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_CAUSAL);
    if (!raw) return {};
    const p = JSON.parse(raw) as Store;
    return typeof p === 'object' && p ? p : {};
  } catch {
    return {};
  }
}

function saveCausalStore(s: Store): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_CAUSAL, JSON.stringify(s));
}

/** Next monotonic causal version per entity at site (client-side). */
export function nextCausalVersion(entityType: EntityType, entityId: string): number {
  const s = loadCausalStore();
  const k = key(entityType, entityId);
  const n = (s[k] ?? 0) + 1;
  s[k] = n;
  saveCausalStore(s);
  return n;
}
