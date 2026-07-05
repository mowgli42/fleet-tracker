import { Before, Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import type { Vehicle, VehicleStatus } from '../../src/lib/types/fleet.ts';
import {
  filterVehicles,
  registerVehicle,
  validateStatusChange,
  type VehicleRegistrationInput
} from '../../src/lib/vehicle/vehicleRules.ts';

type FleetWorld = {
  vehicles: Vehicle[];
  lastError: string | null;
  lastFiltered: Vehicle[];
  lastRegistered: Vehicle | null;
};

function world(): FleetWorld {
  return (globalThis as unknown as { __fleetWorld: FleetWorld }).__fleetWorld;
}

Before(function () {
  (globalThis as unknown as { __fleetWorld: FleetWorld }).__fleetWorld = {
    vehicles: [],
    lastError: null,
    lastFiltered: [],
    lastRegistered: null
  };
});

Given('the fleet has no vehicle with id {string}', function (id: string) {
  world().vehicles = world().vehicles.filter((v) => v.id !== id);
});

Given('the fleet has a vehicle with id {string} and name {string}', function (id: string, name: string) {
  world().vehicles.push({ id, name, status: 'ready' });
});

Given('the fleet has a vehicle with VIN {string}', function (vin: string) {
  world().vehicles.push({ id: 'v-vin', name: 'VIN holder', status: 'ready', vin });
});

Given('the fleet has a vehicle with id {string} and status {string}', function (id: string, status: string) {
  world().vehicles.push({ id, name: id, status: status as VehicleStatus });
});

Given('the fleet has vehicles:', function (table: { hashes: () => Record<string, string>[] }) {
  world().vehicles = table.hashes().map((row) => ({
    id: row.id,
    name: row.name,
    status: (row.status || 'ready') as VehicleStatus,
    vin: row.vin || undefined
  }));
});

When('I register a vehicle with:', function (table: { hashes: () => Record<string, string>[] }) {
  const row = table.hashes()[0];
  const input: VehicleRegistrationInput = {
    name: row.name,
    status: row.status as VehicleStatus
  };
  const id = row.id ?? `auto-${world().vehicles.length + 1}`;
  const result = registerVehicle(world().vehicles, input, id);
  world().lastError = null;
  world().lastRegistered = null;
  if (!result.ok) {
    world().lastError = result.message;
    return;
  }
  world().vehicles.push(result.vehicle);
  world().lastRegistered = result.vehicle;
});

When(
  'I attempt to register a vehicle with id {string} and name {string}',
  function (id: string, name: string) {
    const result = registerVehicle(world().vehicles, { name }, id);
    world().lastError = result.ok ? null : result.message;
    if (result.ok) world().vehicles.push(result.vehicle);
  }
);

When(
  'I attempt to register a vehicle with VIN {string} and name {string}',
  function (vin: string, name: string) {
    const id = `new-${world().vehicles.length + 1}`;
    const result = registerVehicle(world().vehicles, { name, vin }, id);
    world().lastError = result.ok ? null : result.message;
    if (result.ok) world().vehicles.push(result.vehicle);
  }
);

When('I attempt to set vehicle {string} status to {string} without a driver', function (_id: string, status: string) {
  const result = validateStatusChange(status as VehicleStatus, undefined, false);
  world().lastError = result.ok ? null : result.message;
});

When('I filter vehicles by status {string}', function (status: string) {
  world().lastFiltered = filterVehicles(world().vehicles, { status });
});

When('I search vehicles for {string}', function (query: string) {
  world().lastFiltered = filterVehicles(world().vehicles, { query });
});

Then('the fleet should contain a vehicle named {string}', function (name: string) {
  assert.ok(world().vehicles.some((v) => v.name === name));
});

Then('the vehicle status should be {string}', function (status: string) {
  const v = world().lastRegistered;
  assert.ok(v, 'expected a registered vehicle');
  assert.equal(v.status, status);
});

Then('registration should be rejected with message containing {string}', function (fragment: string) {
  assert.ok(world().lastError, 'expected registration error');
  assert.match(world().lastError, new RegExp(fragment, 'i'));
});

Then('status change should be rejected with message containing {string}', function (fragment: string) {
  assert.ok(world().lastError, 'expected status error');
  assert.match(world().lastError, new RegExp(fragment, 'i'));
});

Then('the filtered vehicle ids should be {string}', function (expected: string) {
  const ids = world().lastFiltered.map((v) => v.id).join(',');
  assert.equal(ids, expected);
});
