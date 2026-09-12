import { Before, Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import type { MaintenanceJob, Vehicle } from '../../src/lib/types/fleet.ts';
import {
  buildFleetSchedule,
  buildVehicleSchedule,
  type HorizonHours,
  type SiteScheduleGroup,
  type VehicleScheduleRow
} from '../../src/lib/schedule/scheduleRules.ts';

type ScheduleWorld = {
  vehicles: Vehicle[];
  jobs: MaintenanceJob[];
  nowMs: number;
  horizon: HorizonHours;
  rows: Map<string, VehicleScheduleRow>;
  groups: SiteScheduleGroup[];
};

function world(): ScheduleWorld {
  return (globalThis as unknown as { __scheduleWorld: ScheduleWorld }).__scheduleWorld;
}

Before(function () {
  (globalThis as unknown as { __scheduleWorld: ScheduleWorld }).__scheduleWorld = {
    vehicles: [],
    jobs: [],
    nowMs: Date.parse('2026-08-21T10:00:00Z'),
    horizon: 24,
    rows: new Map(),
    groups: []
  };
});

function upsertVehicle(partial: Vehicle) {
  const existing = world().vehicles.findIndex((v) => v.id === partial.id);
  if (existing >= 0) world().vehicles[existing] = partial;
  else world().vehicles.push(partial);
}

Given('a ready vehicle {string} with no open jobs', function (id: string) {
  upsertVehicle({ id, name: id, status: 'ready' });
});

Given('vehicles {string}, {string}, and {string} in the demo sites', function (a: string, b: string, c: string) {
  upsertVehicle({ id: a, name: a, status: 'ready' });
  upsertVehicle({ id: b, name: b, status: 'ready' });
  upsertVehicle({ id: c, name: c, status: 'reserved' });
});

Given('an in-use vehicle {string} driven by {string}', function (id: string, driver: string) {
  upsertVehicle({ id, name: id, status: 'in-use', driver });
});

Given('a reserved vehicle {string}', function (id: string) {
  upsertVehicle({ id, name: id, status: 'reserved' });
});

Given('a maintenance vehicle {string} with an open unplanned job {string}', function (id: string, title: string) {
  upsertVehicle({ id, name: id, status: 'maintenance' });
  world().jobs.push({
    id: `job-${id}`,
    vehicleId: id,
    title,
    description: '',
    priority: 'high',
    status: 'open',
    createdAt: '2026-08-20',
    updatedAt: '2026-08-20',
    history: [],
    planned: false,
    laborHoursActual: 4
  });
});

Given('an open planned job {string} for {string}', function (title: string, vehicleId: string) {
  world().jobs.push({
    id: `pm-${vehicleId}`,
    vehicleId,
    title,
    description: '',
    priority: 'low',
    status: 'open',
    createdAt: '2026-08-20',
    updatedAt: '2026-08-20',
    history: [],
    planned: true,
    dueDate: '2026-03-12'
  });
});

function buildAll(horizon: HorizonHours) {
  world().horizon = horizon;
  world().groups = buildFleetSchedule(world().vehicles, world().jobs, world().nowMs, horizon);
  world().rows = new Map(
    world().vehicles.map((v) => [v.id, buildVehicleSchedule(v, world().jobs, world().nowMs, horizon)])
  );
}

When('I build the {int} hour schedule', function (hours: number) {
  buildAll(hours as HorizonHours);
});

When('I build the {int} hour fleet schedule', function (hours: number) {
  buildAll(hours as HorizonHours);
});

Then('vehicle {string} should have a single {string} segment', function (id: string, kind: string) {
  const row = world().rows.get(id);
  assert.ok(row);
  assert.equal(row.segments.length, 1);
  assert.equal(row.segments[0].kind, kind);
});

Then('the schedule groups should be {string}, {string}, and {string}', function (a: string, b: string, c: string) {
  assert.deepEqual(world().groups.map((g) => g.siteName), [a, b, c]);
});

Then('the first segment for {string} should be {string}', function (id: string, kind: string) {
  const row = world().rows.get(id);
  assert.ok(row);
  assert.equal(row.segments[0].kind, kind);
});

Then(
  'the first segment for {string} should be {string} labeled {string}',
  function (id: string, kind: string, label: string) {
    const row = world().rows.get(id);
    assert.ok(row);
    assert.equal(row.segments[0].kind, kind);
    assert.equal(row.segments[0].label, label);
  }
);

Then('the scheduled segment for {string} should start after unscheduled work', function (id: string) {
  const row = world().rows.get(id);
  assert.ok(row);
  const red = row.segments.find((s) => s.kind === 'unscheduled_maint');
  const yellow = row.segments.find((s) => s.kind === 'scheduled_maint');
  assert.ok(red);
  assert.ok(yellow);
  assert.ok(yellow.startMs >= red.endMs);
});

Then('vehicle {string} should be marked able to defer scheduled maintenance', function (id: string) {
  const row = world().rows.get(id);
  assert.ok(row);
  assert.equal(row.canDeferScheduled, true);
});
