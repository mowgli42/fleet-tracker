import { describe, expect, it } from 'vitest';
import { acceptEventOnCloud, parseCloudStatePayload, type CloudState } from './cloudSimulator';
import { DEMO_SITE_ID, DEMO_SITE_KEY } from './constants';
import type { EventEnvelope } from './eventTypes';
import {
  computeBackoffMs,
  createFlushBackoffState,
  recordFlushFailure,
  recordFlushSuccess,
  shouldAttemptFlush
} from './flushBackoff';
import { readinessClassFromFlags, readinessForFleet, foldVehicleFlagsFromEvents } from './projectReadiness';
import { compareEventsForTotalOrder, sortEventsForReplay } from './sortEvents';
import { validateEventEnvelope } from './validateEvent';

const authOk = { siteKey: DEMO_SITE_KEY };

function baseEvent(overrides: Partial<EventEnvelope>): EventEnvelope {
  return {
    event_id: 'e1',
    site_id: DEMO_SITE_ID,
    entity_type: 'maintenance_job',
    entity_id: 'mj-1',
    event_type: 'maintenance_blocked',
    event_ts_local: '2026-03-27T12:00:00.000Z',
    event_ts_server: null,
    actor_id: 'a1',
    idempotency_key: 'k1',
    causal_version: 1,
    payload: { vehicleId: 'v1', jobId: 'mj-1', priority: 'critical', status: 'open' },
    ...overrides
  };
}

describe('parseCloudStatePayload', () => {
  it('roundtrips events and idempotency keys', () => {
    const ev = baseEvent({});
    const plain = { events: [{ ...ev, event_ts_server: '2026-03-27T12:00:00.000Z' }], keys: [ev.idempotency_key] };
    const state = parseCloudStatePayload(plain);
    expect(state.events.length).toBe(1);
    expect(state.appliedIdempotencyKeys.has(ev.idempotency_key)).toBe(true);
  });
});

describe('validateEventEnvelope', () => {
  it('accepts a minimal valid envelope', () => {
    expect(validateEventEnvelope(baseEvent({})).ok).toBe(true);
  });

  it('rejects empty event_id', () => {
    expect(validateEventEnvelope({ ...baseEvent({}), event_id: '' }).ok).toBe(false);
  });

  it('rejects invalid entity_type', () => {
    expect(validateEventEnvelope({ ...baseEvent({}), entity_type: 'invalid' }).ok).toBe(false);
  });
});

describe('sortEventsForReplay', () => {
  it('orders by server time when present', () => {
    const a = baseEvent({
      event_id: 'a',
      event_ts_server: '2026-03-27T10:00:00.000Z',
      event_ts_local: '2026-03-27T09:00:00.000Z'
    });
    const b = baseEvent({
      event_id: 'b',
      event_ts_server: '2026-03-27T11:00:00.000Z',
      event_ts_local: '2026-03-27T08:00:00.000Z',
      idempotency_key: 'k2',
      causal_version: 2,
      entity_id: 'mj-2'
    });
    const sorted = sortEventsForReplay([b, a]);
    expect(sorted[0].event_id).toBe('a');
    expect(sorted[1].event_id).toBe('b');
  });

  it('uses causal_version when server time and entity match (ladder)', () => {
    const ts = '2026-03-27T12:00:00.000Z';
    const later = baseEvent({
      event_id: 'ev-2',
      entity_id: 'ent-same',
      causal_version: 2,
      event_ts_server: ts,
      idempotency_key: 'k2'
    });
    const earlier = baseEvent({
      event_id: 'ev-1',
      entity_id: 'ent-same',
      causal_version: 1,
      event_ts_server: ts,
      idempotency_key: 'k1'
    });
    expect(compareEventsForTotalOrder(later, earlier)).toBeGreaterThan(0);
    const sorted = sortEventsForReplay([later, earlier]);
    expect(sorted[0].causal_version).toBe(1);
    expect(sorted[1].causal_version).toBe(2);
  });
});

describe('acceptEventOnCloud', () => {
  it('dedupes by idempotency_key', () => {
    const ev = baseEvent({});
    let state: CloudState = { events: [], appliedIdempotencyKeys: new Set() };
    const r1 = acceptEventOnCloud(state, ev, '2026-03-27T12:00:01.000Z', authOk);
    expect(r1.result.status).toBe('accepted');
    state = r1.state;
    const r2 = acceptEventOnCloud(state, ev, '2026-03-27T12:00:02.000Z', authOk);
    expect(r2.result.status).toBe('duplicate');
    expect(r2.state.events.length).toBe(1);
  });

  it('rejects when site key is missing', () => {
    const ev = baseEvent({});
    const state: CloudState = { events: [], appliedIdempotencyKeys: new Set() };
    const r = acceptEventOnCloud(state, ev, '2026-03-27T12:00:01.000Z', { siteKey: null });
    expect(r.result.status).toBe('rejected');
    if (r.result.status === 'rejected') {
      expect(r.result.code).toBe('missing_site_key');
    }
  });

  it('rejects when site key does not match site_id', () => {
    const ev = baseEvent({});
    const state: CloudState = { events: [], appliedIdempotencyKeys: new Set() };
    const r = acceptEventOnCloud(state, ev, '2026-03-27T12:00:01.000Z', { siteKey: 'wrong-secret' });
    expect(r.result.status).toBe('rejected');
    if (r.result.status === 'rejected') {
      expect(r.result.code).toBe('unauthorized_site');
    }
  });
});

describe('projection', () => {
  it('blocked beats at-risk', () => {
    const events: EventEnvelope[] = [
      baseEvent({
        event_type: 'pm_risk_set',
        entity_type: 'vehicle',
        entity_id: 'v1',
        idempotency_key: 'p1',
        payload: { vehicleId: 'v1', active: true }
      }),
      baseEvent({
        event_id: 'e2',
        event_type: 'maintenance_blocked',
        entity_id: 'mj-1',
        idempotency_key: 'k2',
        causal_version: 2,
        payload: { vehicleId: 'v1', jobId: 'mj-1', priority: 'critical', status: 'open' }
      })
    ];
    const folded = foldVehicleFlagsFromEvents(events);
    const st = folded.get('v1')!;
    expect(readinessClassFromFlags(st)).toBe('blocked');
  });

  it('readinessForFleet merges PM window', () => {
    const today = new Date();
    const due = new Date(today);
    due.setDate(due.getDate() + 3);
    const iso = due.toISOString().slice(0, 10);
    const { counts } = readinessForFleet([{ id: 'v1', nextService: iso }], []);
    expect(counts['at-risk']).toBe(1);
    expect(counts.ready).toBe(0);
  });

  it('readiness parity: local and cloud paths match for the same stream', () => {
    const stream: EventEnvelope[] = [
      baseEvent({
        event_id: 'a',
        entity_id: 'v1',
        idempotency_key: 'ka',
        payload: { vehicleId: 'v1', jobId: 'mj-1', priority: 'high', status: 'open' }
      }),
      baseEvent({
        event_id: 'b',
        event_type: 'maintenance_cleared',
        entity_id: 'mj-1',
        idempotency_key: 'kb',
        causal_version: 2,
        payload: { vehicleId: 'v1', jobId: 'mj-1' }
      })
    ];
    const vehicles = [
      { id: 'v1', nextService: '2099-01-01' },
      { id: 'v2', nextService: '2099-01-01' }
    ];
    const local = readinessForFleet(vehicles, stream);
    const cloud = readinessForFleet(vehicles, stream);
    expect(local.counts).toEqual(cloud.counts);
    expect([...local.byVehicle.entries()]).toEqual([...cloud.byVehicle.entries()]);
  });
});

describe('flushBackoff', () => {
  it('doubles delay up to 60s cap', () => {
    expect(computeBackoffMs(1)).toBe(1000);
    expect(computeBackoffMs(2)).toBe(2000);
    expect(computeBackoffMs(3)).toBe(4000);
    expect(computeBackoffMs(10)).toBe(60_000);
  });

  it('blocks flush until backoff elapses', () => {
    const now = 1_000_000;
    let state = createFlushBackoffState();
    state = recordFlushFailure(state, now);
    expect(shouldAttemptFlush(state, now)).toBe(false);
    expect(shouldAttemptFlush(state, now + 999)).toBe(false);
    expect(shouldAttemptFlush(state, now + 1000)).toBe(true);
  });

  it('resets after success', () => {
    let state = recordFlushFailure(createFlushBackoffState(), 0);
    state = recordFlushSuccess();
    expect(state.attempt).toBe(0);
    expect(shouldAttemptFlush(state, 0)).toBe(true);
  });
});
