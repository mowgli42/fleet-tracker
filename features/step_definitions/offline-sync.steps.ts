import { Before, Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import {
  acceptEventOnCloud,
  loadCloudState,
  type AcceptResult,
  type CloudState
} from '../../src/lib/sync/cloudSimulator.ts';
import { DEMO_SITE_ID, DEMO_SITE_KEY } from '../../src/lib/sync/constants.ts';
import type { EventEnvelope } from '../../src/lib/sync/eventTypes.ts';
import {
  createFlushBackoffState,
  recordFlushFailure,
  recordFlushSuccess,
  shouldAttemptFlush,
  type FlushBackoffState
} from '../../src/lib/sync/flushBackoff.ts';
import { loadLocalEvents } from '../../src/lib/sync/localEventLog.ts';
import { enqueueOutbox, loadOutbox } from '../../src/lib/sync/outbox.ts';
import { sortEventsForReplay } from '../../src/lib/sync/sortEvents.ts';
import { appendAndQueueEvent, flushOutboxToLocalCloud } from '../../src/lib/sync/syncPipeline.ts';
import { validateEventEnvelope, type ValidateResult } from '../../src/lib/sync/validateEvent.ts';

type OfflineSyncWorld = {
  event: EventEnvelope;
  validation: ValidateResult | null;
  appendError: Error | null;
  cloudState: CloudState;
  acceptResult: AcceptResult | null;
  isOnline: boolean;
  flushResult: { processed: number; lastError?: string } | null;
  backoff: FlushBackoffState;
  sortInput: EventEnvelope[];
  sorted: EventEnvelope[];
};

function world(): OfflineSyncWorld {
  return (globalThis as unknown as { __offlineSyncWorld: OfflineSyncWorld }).__offlineSyncWorld;
}

function installMemoryLocalStorage(): void {
  const store = new Map<string, string>();
  const localStorage = {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    }
  };
  (globalThis as unknown as { window: { localStorage: typeof localStorage } }).window = {
    localStorage
  };
}

function baseEvent(overrides: Partial<EventEnvelope> = {}): EventEnvelope {
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

Before(function () {
  installMemoryLocalStorage();
  (globalThis as unknown as { __offlineSyncWorld: OfflineSyncWorld }).__offlineSyncWorld = {
    event: baseEvent(),
    validation: null,
    appendError: null,
    cloudState: { events: [], appliedIdempotencyKeys: new Set() },
    acceptResult: null,
    isOnline: true,
    flushResult: null,
    backoff: createFlushBackoffState(),
    sortInput: [],
    sorted: []
  };
});

Given('a valid maintenance event envelope', function () {
  world().event = baseEvent();
});

Given('a valid maintenance event envelope with empty event_id', function () {
  world().event = baseEvent({ event_id: '' });
});

Given('a valid maintenance event envelope with entity_type {string}', function (entityType: string) {
  world().event = baseEvent({ entity_type: entityType as EventEnvelope['entity_type'] });
});

Given('a clean sync store', function () {
  installMemoryLocalStorage();
});

Given('a clean cloud state', function () {
  world().cloudState = { events: [], appliedIdempotencyKeys: new Set() };
});

Given('cloud is online', function () {
  world().isOnline = true;
});

Given('cloud is offline', function () {
  world().isOnline = false;
});

Given('a valid maintenance event envelope is queued in the outbox', function () {
  world().event = baseEvent();
  appendAndQueueEvent(world().event);
});

Given('a flush backoff state', function () {
  world().backoff = createFlushBackoffState();
});

Given('a flush backoff state with a prior error at time {int}', function (now: number) {
  world().backoff = recordFlushFailure(createFlushBackoffState(), now);
});

Given('two events with different event_ts_server values', function () {
  world().sortInput = [
    baseEvent({
      event_id: 'b',
      event_ts_server: '2026-03-27T11:00:00.000Z',
      event_ts_local: '2026-03-27T08:00:00.000Z',
      idempotency_key: 'k2',
      causal_version: 2,
      entity_id: 'mj-2'
    }),
    baseEvent({
      event_id: 'a',
      event_ts_server: '2026-03-27T10:00:00.000Z',
      event_ts_local: '2026-03-27T09:00:00.000Z'
    })
  ];
});

Given('two events for the same entity with equal event_ts_server', function () {
  const ts = '2026-03-27T12:00:00.000Z';
  world().sortInput = [
    baseEvent({
      event_id: 'ev-2',
      entity_id: 'ent-same',
      causal_version: 2,
      event_ts_server: ts,
      idempotency_key: 'k2'
    }),
    baseEvent({
      event_id: 'ev-1',
      entity_id: 'ent-same',
      causal_version: 1,
      event_ts_server: ts,
      idempotency_key: 'k1'
    })
  ];
});

When('I validate the event envelope', function () {
  world().validation = validateEventEnvelope(world().event);
});

When('I append and queue the event', function () {
  try {
    appendAndQueueEvent(world().event);
    world().appendError = null;
  } catch (err) {
    world().appendError = err as Error;
  }
});

When('I accept the event on cloud with correct site key', function () {
  const r = acceptEventOnCloud(world().cloudState, world().event, '2026-03-27T12:00:01.000Z', {
    siteKey: DEMO_SITE_KEY
  });
  world().cloudState = r.state;
  world().acceptResult = r.result;
});

When('I accept the event on cloud with site key {string}', function (siteKey: string) {
  const r = acceptEventOnCloud(world().cloudState, world().event, '2026-03-27T12:00:01.000Z', {
    siteKey
  });
  world().cloudState = r.state;
  world().acceptResult = r.result;
});

When('I flush the outbox to cloud', function () {
  world().flushResult = flushOutboxToLocalCloud(world().isOnline);
});

When('a flush attempt returns lastError at time {int}', function (now: number) {
  world().backoff = recordFlushFailure(world().backoff, now);
});

When('a subsequent flush succeeds', function () {
  world().backoff = recordFlushSuccess();
});

When('I sort events for replay', function () {
  world().sorted = sortEventsForReplay(world().sortInput);
});

Then('envelope validation should succeed', function () {
  assert.equal(world().validation?.ok, true);
});

Then('envelope validation should fail with a non-empty reason', function () {
  assert.equal(world().validation?.ok, false);
  if (world().validation && !world().validation.ok) {
    assert.ok(world().validation.reason.length > 0);
  }
});

Then('envelope validation should fail', function () {
  assert.equal(world().validation?.ok, false);
});

Then('the event should appear in the local log', function () {
  const events = loadLocalEvents();
  assert.ok(events.some((e) => e.event_id === world().event.event_id));
});

Then('the event should appear in the outbox', function () {
  const events = loadOutbox();
  assert.ok(events.some((e) => e.idempotency_key === world().event.idempotency_key));
});

Then('append and queue should throw', function () {
  assert.ok(world().appendError instanceof Error);
});

Then('the local log should be empty', function () {
  assert.equal(loadLocalEvents().length, 0);
});

Then('the outbox should be empty', function () {
  assert.equal(loadOutbox().length, 0);
});

Then('cloud accept status should be {string}', function (status: string) {
  assert.equal(world().acceptResult?.status, status);
});

Then('the stored event should have event_ts_server set', function () {
  const stored = world().cloudState.events.find((e) => e.event_id === world().event.event_id);
  assert.ok(stored);
  assert.ok(typeof stored!.event_ts_server === 'string' && stored!.event_ts_server.length > 0);
});

Then('cloud should contain exactly {int} event', function (n: number) {
  assert.equal(world().cloudState.events.length, n);
});

Then('the reject reason should be auth-related', function () {
  assert.equal(world().acceptResult?.status, 'rejected');
  if (world().acceptResult?.status === 'rejected') {
    assert.ok(
      world().acceptResult.code === 'unauthorized_site' ||
        world().acceptResult.code === 'missing_site_key'
    );
  }
});

Then('the outbox depth should be {int}', function (n: number) {
  assert.equal(loadOutbox().length, n);
});

Then('cloud should contain those queued events', function () {
  const cloud = loadCloudState();
  assert.ok(cloud.events.some((e) => e.idempotency_key === world().event.idempotency_key));
});

Then('the event should remain in the local log', function () {
  assert.ok(loadLocalEvents().some((e) => e.event_id === world().event.event_id));
});

Then('flush should not be attempted at time {int}', function (now: number) {
  assert.equal(shouldAttemptFlush(world().backoff, now), false);
});

Then('flush should be attempted at time {int}', function (now: number) {
  assert.equal(shouldAttemptFlush(world().backoff, now), true);
});

Then('flush backoff should reset to the base interval', function () {
  assert.equal(world().backoff.attempt, 0);
  assert.equal(shouldAttemptFlush(world().backoff, 0), true);
});

Then('the earlier server timestamp should sort first', function () {
  assert.equal(world().sorted[0]?.event_id, 'a');
  assert.equal(world().sorted[1]?.event_id, 'b');
});

Then('the lower causal_version should sort first', function () {
  assert.equal(world().sorted[0]?.causal_version, 1);
  assert.equal(world().sorted[1]?.causal_version, 2);
});
