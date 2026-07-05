import type { EventEnvelope } from './eventTypes';

/**
 * Primary timestamp for ordering: server time when present (post-accept), else local clock at site.
 * See docs/SYNC-ORDERING-LADDER.md — do not use local time alone for cross-site semantics.
 */
export function primaryTimestampForOrder(e: EventEnvelope): string {
  return e.event_ts_server ?? e.event_ts_local;
}

/**
 * Deterministic total order for replay (ascending). Same contract as documented ladder.
 * Returns negative if a < b, positive if a > b, 0 if equal on all keys (should be rare).
 */
export function compareEventsForTotalOrder(a: EventEnvelope, b: EventEnvelope): number {
  const ta = primaryTimestampForOrder(a);
  const tb = primaryTimestampForOrder(b);
  let c = ta.localeCompare(tb);
  if (c !== 0) return c;
  c = a.site_id.localeCompare(b.site_id);
  if (c !== 0) return c;
  c = a.entity_id.localeCompare(b.entity_id);
  if (c !== 0) return c;
  if (a.causal_version !== b.causal_version) return a.causal_version - b.causal_version;
  return a.event_id.localeCompare(b.event_id);
}

/**
 * Stable sort for projection replay. Uses compareEventsForTotalOrder.
 */
export function sortEventsForReplay(events: EventEnvelope[]): EventEnvelope[] {
  return [...events].sort(compareEventsForTotalOrder);
}
