import { DEMO_SITE_ID } from './constants';
import { nextCausalVersion } from './causalVersion';
import type { EntityType, EventEnvelope, EventPayload, EventType } from './eventTypes';

export function createEvent(input: {
  entity_type: EntityType;
  entity_id: string;
  event_type: EventType;
  payload: EventPayload;
  actor_id: string;
}): EventEnvelope {
  const causal_version = nextCausalVersion(input.entity_type, input.entity_id);
  const idempotency_key = `${DEMO_SITE_ID}:${input.entity_id}:${input.event_type}:${causal_version}`;
  return {
    event_id: crypto.randomUUID(),
    site_id: DEMO_SITE_ID,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    event_type: input.event_type,
    event_ts_local: new Date().toISOString(),
    event_ts_server: null,
    actor_id: input.actor_id,
    idempotency_key,
    causal_version,
    payload: input.payload
  };
}
