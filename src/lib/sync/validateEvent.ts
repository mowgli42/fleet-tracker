import type { EntityType, EventEnvelope, EventType } from './eventTypes';

const ENTITY_TYPES: EntityType[] = ['vehicle', 'maintenance_job', 'transfer'];
const EVENT_TYPES: EventType[] = [
  'maintenance_blocked',
  'maintenance_cleared',
  'pm_risk_set',
  'transfer_created',
  'transfer_applied'
];

export type ValidateResult = { ok: true } | { ok: false; reason: string };

export function validateEventEnvelope(e: unknown): ValidateResult {
  if (!e || typeof e !== 'object') return { ok: false, reason: 'not an object' };
  const o = e as Record<string, unknown>;

  if (typeof o.event_id !== 'string' || !o.event_id) return { ok: false, reason: 'missing event_id' };
  if (typeof o.site_id !== 'string' || !o.site_id) return { ok: false, reason: 'missing site_id' };
  if (typeof o.entity_id !== 'string' || !o.entity_id) return { ok: false, reason: 'missing entity_id' };
  if (!ENTITY_TYPES.includes(o.entity_type as EntityType)) return { ok: false, reason: 'invalid entity_type' };
  if (!EVENT_TYPES.includes(o.event_type as EventType)) return { ok: false, reason: 'invalid event_type' };
  if (typeof o.event_ts_local !== 'string' || !o.event_ts_local) return { ok: false, reason: 'missing event_ts_local' };
  if (o.event_ts_server != null && typeof o.event_ts_server !== 'string') {
    return { ok: false, reason: 'event_ts_server must be string or null' };
  }
  if (typeof o.actor_id !== 'string') return { ok: false, reason: 'missing actor_id' };
  if (typeof o.idempotency_key !== 'string' || !o.idempotency_key) return { ok: false, reason: 'missing idempotency_key' };
  if (typeof o.causal_version !== 'number' || o.causal_version < 1) {
    return { ok: false, reason: 'invalid causal_version' };
  }
  if (!o.payload || typeof o.payload !== 'object') return { ok: false, reason: 'missing payload' };

  return { ok: true };
}

export function assertValidEnvelope(e: unknown): asserts e is EventEnvelope {
  const r = validateEventEnvelope(e);
  if (!r.ok) throw new Error(`Invalid event: ${r.reason}`);
}
