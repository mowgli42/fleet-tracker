import { STORAGE_LOCAL_EVENTS } from './constants';
import type { EventEnvelope } from './eventTypes';
import { validateEventEnvelope } from './validateEvent';

export function loadLocalEvents(): EventEnvelope[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_LOCAL_EVENTS);
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

export function saveLocalEvents(events: EventEnvelope[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_LOCAL_EVENTS, JSON.stringify(events));
}

export function appendLocalEvent(event: EventEnvelope): void {
  const v = validateEventEnvelope(event);
  if (!v.ok) throw new Error(`Invalid event: ${v.reason}`);
  const cur = loadLocalEvents();
  cur.push(event);
  saveLocalEvents(cur);
}
