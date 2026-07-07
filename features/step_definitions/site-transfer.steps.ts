import { Before, Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import type { EventEnvelope } from '../../src/lib/sync/eventTypes.ts';
import { createEvent } from '../../src/lib/sync/createEvent.ts';
import { readinessForFleet } from '../../src/lib/sync/projectReadiness.ts';
import {
  createTransferPayload,
  isVehicleInTransit,
  shouldApplyTransfer
} from '../../src/lib/sync/siteTransferRules.ts';

type TransferWorld = { events: EventEnvelope[]; readiness: string | null; inTransit: boolean };

function world(): TransferWorld {
  return (globalThis as unknown as { __transferWorld: TransferWorld }).__transferWorld;
}

Before(function () {
  (globalThis as unknown as { __transferWorld: TransferWorld }).__transferWorld = {
    events: [],
    readiness: null,
    inTransit: false
  };
});

Given('no transfer events exist', function () {
  world().events = [];
});

Given('a pending transfer for vehicle {string} to site {string}', function (vehicleId: string, toSite: string) {
  world().events.push(
    createEvent({
      entity_type: 'transfer',
      entity_id: 'xfer-1',
      event_type: 'transfer_created',
      actor_id: 'op',
      payload: createTransferPayload({
        vehicleId,
        fromSiteId: 'site-a',
        toSiteId: toSite,
        transferId: 'xfer-1'
      })
    })
  );
});

Given('a transfer for vehicle {string} created {int} days ago', function (vehicleId: string, days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const e = createEvent({
    entity_type: 'transfer',
    entity_id: 'xfer-stale',
    event_type: 'transfer_created',
    actor_id: 'op',
    payload: createTransferPayload({
      vehicleId,
      fromSiteId: 'site-a',
      toSiteId: 'site-b',
      transferId: 'xfer-stale'
    })
  });
  e.event_ts_local = d.toISOString();
  world().events = [e];
});

When('I create a transfer for vehicle {string} from site {string} to site {string}', function (
  vehicleId: string,
  fromSite: string,
  toSite: string
) {
  world().events.push(
    createEvent({
      entity_type: 'transfer',
      entity_id: 'xfer-new',
      event_type: 'transfer_created',
      actor_id: 'op',
      payload: createTransferPayload({
        vehicleId,
        fromSiteId: fromSite,
        toSiteId: toSite,
        transferId: 'xfer-new'
      })
    })
  );
  world().inTransit = isVehicleInTransit(world().events, vehicleId);
});

When('transfer is applied for vehicle {string}', function (vehicleId: string) {
  world().events.push(
    createEvent({
      entity_type: 'transfer',
      entity_id: 'xfer-1',
      event_type: 'transfer_applied',
      actor_id: 'op',
      payload: createTransferPayload({
        vehicleId,
        fromSiteId: 'site-a',
        toSiteId: 'site-b',
        transferId: 'xfer-1'
      })
    })
  );
});

When('I compute readiness for vehicle {string}', function (vehicleId: string) {
  const result = readinessForFleet([{ id: vehicleId }], world().events);
  world().readiness = result.byVehicle.get(vehicleId) ?? 'ready';
});

Then('vehicle {string} should be in transit', function (vehicleId: string) {
  assert.equal(isVehicleInTransit(world().events, vehicleId), true);
});

Then('vehicle {string} should not be in transit', function (vehicleId: string) {
  assert.equal(isVehicleInTransit(world().events, vehicleId), false);
});

Then('transfer readiness for vehicle {string} should be {string}', function (vehicleId: string, cls: string) {
  if (world().readiness == null) {
    const result = readinessForFleet([{ id: vehicleId }], world().events);
    world().readiness = result.byVehicle.get(vehicleId) ?? 'ready';
  }
  assert.equal(world().readiness, cls);
});
