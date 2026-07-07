import { Before, Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import type { DriverTrackingToken, MaintenanceJob, Vehicle } from '../../src/lib/types/fleet.ts';
import {
  buildDriverStatusView,
  createTrackingToken,
  resolveTrackingToken
} from '../../src/lib/driver/driverStatusBoardRules.ts';

type DriverWorld = {
  tokens: DriverTrackingToken[];
  token: DriverTrackingToken | null;
  vehicle?: Vehicle;
  job?: MaintenanceJob;
  view: ReturnType<typeof buildDriverStatusView>;
};

function world(): DriverWorld {
  return (globalThis as unknown as { __driverWorld: DriverWorld }).__driverWorld;
}

Before(function () {
  (globalThis as unknown as { __driverWorld: DriverWorld }).__driverWorld = {
    tokens: [], token: null, view: null
  };
});

When('tracking is enabled for vehicle {string} driver {string}', function (vehicleId: string, driver: string) {
  world().token = createTrackingToken(vehicleId, driver, '2026-01-01T00:00:00Z');
  world().tokens.push(world().token);
});

When('token guess {string} is validated', function (guess: string) {
  world().token = resolveTrackingToken(guess, world().tokens);
});

Given('vehicle {string} named {string} in maintenance', function (id: string, name: string) {
  world().vehicle = { id, name, status: 'maintenance' };
});

Given('driver open job titled {string} with status {string}', function (title: string, status: string) {
  world().job = {
    id: 'j1', vehicleId: world().vehicle?.id ?? 'v1', title, description: '', priority: 'medium',
    status: status as MaintenanceJob['status'], createdAt: '2026-01-01', updatedAt: '2026-01-01', history: [], planned: false
  };
});

When('driver status view is built', function () {
  world().view = buildDriverStatusView(world().vehicle, world().job);
});

Then('a tracking token should be issued for {string}', function (vehicleId: string) {
  assert.ok(world().token?.vehicleId === vehicleId);
  assert.ok(world().token?.token.length > 10);
});

Then('token resolution should be null', function () {
  assert.equal(world().token, null);
});

Then('status view should be read-only', function () {
  assert.equal(world().view?.readOnly, true);
});

Then('status text should mention progress', function () {
  assert.match(world().view?.statusText ?? '', /progress/i);
});
