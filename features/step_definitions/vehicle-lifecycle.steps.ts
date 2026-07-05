import { Before, Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import type { MaintenanceJob, Vehicle, VehicleStatus } from '../../src/lib/types/fleet.ts';
import {
  checkoutVehicle,
  intakeVehicle,
  releaseVehicle,
  validateCheckout
} from '../../src/lib/vehicle/vehicleLifecycleRules.ts';

type LifecycleWorld = {
  vehicles: Vehicle[];
  jobs: MaintenanceJob[];
  lastError: string | null;
};

function world(): LifecycleWorld {
  return (globalThis as unknown as { __lifecycleWorld: LifecycleWorld }).__lifecycleWorld;
}

Before(function () {
  (globalThis as unknown as { __lifecycleWorld: LifecycleWorld }).__lifecycleWorld = {
    vehicles: [],
    jobs: [],
    lastError: null
  };
});

Given('a lifecycle vehicle {string} with status {string}', function (id: string, status: string) {
  world().vehicles.push({ id, name: id, status: status as VehicleStatus });
});

Given('the vehicle {string} has odometer {int}', function (id: string, odometer: number) {
  const v = world().vehicles.find((x) => x.id === id);
  assert.ok(v);
  v.odometer = odometer;
});

Given('vehicle {string} has an open maintenance job', function (id: string) {
  const job: MaintenanceJob = {
    id: 'mj-open',
    vehicleId: id,
    title: 'Open job',
    description: '',
    priority: 'medium',
    status: 'open',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    history: [],
    planned: false
  };
  world().jobs.push(job);
  const v = world().vehicles.find((x) => x.id === id);
  if (v) v.currentJobId = job.id;
});

Given('vehicle {string} has no open maintenance jobs', function (id: string) {
  world().jobs = world().jobs.filter((j) => !(j.vehicleId === id && j.status !== 'completed'));
});

When('I intake vehicle {string} for maintenance', function (id: string) {
  const v = world().vehicles.find((x) => x.id === id);
  assert.ok(v);
  const result = intakeVehicle(v, world().jobs, { odometer: v.odometer });
  world().lastError = null;
  if (!result.ok) {
    world().lastError = result.message;
    return;
  }
  world().vehicles = world().vehicles.map((x) => (x.id === id ? result.vehicle : x));
  world().jobs.push(result.job);
});

When('I attempt checkout for vehicle {string} without a driver', function (id: string) {
  const check = validateCheckout(undefined);
  world().lastError = check.ok ? null : check.message;
});

When('I checkout vehicle {string} to driver {string}', function (id: string, driver: string) {
  const v = world().vehicles.find((x) => x.id === id);
  assert.ok(v);
  const result = checkoutVehicle(v, driver);
  world().lastError = null;
  if (!result.ok) {
    world().lastError = result.message;
    return;
  }
  world().vehicles = world().vehicles.map((x) => (x.id === id ? result.vehicle : x));
});

When('I attempt release for vehicle {string}', function (id: string) {
  const v = world().vehicles.find((x) => x.id === id);
  assert.ok(v);
  const result = releaseVehicle(v, world().jobs);
  world().lastError = result.ok ? null : result.message;
});

When('I release vehicle {string}', function (id: string) {
  const v = world().vehicles.find((x) => x.id === id);
  assert.ok(v);
  const result = releaseVehicle(v, world().jobs);
  world().lastError = null;
  if (!result.ok) {
    world().lastError = result.message;
    return;
  }
  world().vehicles = world().vehicles.map((x) => (x.id === id ? result.vehicle : x));
});

Then('vehicle {string} status should be {string}', function (id: string, status: string) {
  const v = world().vehicles.find((x) => x.id === id);
  assert.ok(v);
  assert.equal(v.status, status);
});

Then('vehicle {string} should have an open maintenance job', function (id: string) {
  assert.ok(world().jobs.some((j) => j.vehicleId === id && j.status !== 'completed'));
});

Then('the open job should record odometer at open {int}', function (odo: number) {
  const job = world().jobs.find((j) => j.status === 'open');
  assert.ok(job);
  assert.equal(job.odometerAtJobOpen, odo);
});

Then('vehicle {string} driver should be {string}', function (id: string, driver: string) {
  const v = world().vehicles.find((x) => x.id === id);
  assert.ok(v);
  assert.equal(v.driver, driver);
});

Then('lifecycle action should be rejected with message containing {string}', function (fragment: string) {
  assert.ok(world().lastError);
  assert.match(world().lastError, new RegExp(fragment, 'i'));
});
