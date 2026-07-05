import { STORAGE_OUTBOX } from './constants';
import type { EventEnvelope } from './eventTypes';
import { validateEventEnvelope } from './validateEvent';

/** Pending events not yet acknowledged by cloud (simulator). */
export function loadOutbox(): EventEnvelope[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_OUTBOX);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown[];
    if (!Array.isArray(arr)) return [];
    const out: EventEnvelope[] = [];
    for (const item of arr) {
      if (validateEventEnvelope(item).ok) out.push(item as EventEnvelope);
    }
    return out;
  } catch {
    return [];
  }
}

export function saveOutbox(events: EventEnvelope[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_OUTBOX, JSON.stringify(events));
}

export function enqueueOutbox(event: EventEnvelope): void {
  const cur = loadOutbox();
  cur.push(event);
  saveOutbox(cur);
}

export function removeFromOutbox(idempotencyKey: string): void {
  const cur = loadOutbox().filter((e) => e.idempotency_key !== idempotencyKey);
  saveOutbox(cur);
}
