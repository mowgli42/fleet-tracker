import { Before, Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import type { MaintenanceJob, Vehicle } from '../../src/lib/types/fleet.ts';
import { computePmCompliancePct } from '../../src/lib/pm/pmSchedulingRules.ts';
import { readinessForFleet } from '../../src/lib/sync/projectReadiness.ts';

type PmWorld = {
  vehicles: Vehicle[];
  jobs: MaintenanceJob[];
  pmPct: number | null;
  readiness: Map<string, string>;
};

function world(): PmWorld {
  return (globalThis as unknown as { __pmWorld: PmWorld }).__pmWorld;
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

Before(function () {
  (globalThis as unknown as { __pmWorld: PmWorld }).__pmWorld = {
    vehicles: [],
    jobs: [],
    pmPct: null,
    readiness: new Map()
  };
});

Given('a vehicle {string} with nextService in {int} days', function (id: string, days: number) {
  world().vehicles.push({ id, name: id, status: 'ready', nextService: addDays(days) });
});

Given('no blocking maintenance events for {string}', function (_id: string) {
  // no events needed
});

Given('a vehicle {string} with nextService {string}', function (id: string, nextService: string) {
  world().vehicles.push({ id, name: id, status: 'ready', nextService });
});

Given('no qualifying PM jobs for {string}', function (_id: string) {
  world().jobs = [];
});

Given('a completed planned oil-change job for {string} completed {string}', function (vehicleId: string, completedAt: string) {
  world().jobs.push({
    id: 'pm1',
    vehicleId,
    title: 'PM oil',
    description: '',
    priority: 'medium',
    status: 'completed',
    createdAt: '2026-01-01',
    updatedAt: completedAt,
    completedAt,
    history: [],
    planned: true,
    serviceType: 'oil-change'
  });
});

When('I compute readiness for the fleet', function () {
  const result = readinessForFleet(world().vehicles, []);
  world().readiness = result.byVehicle;
});

When('I compute PM compliance', function () {
  world().pmPct = computePmCompliancePct(world().vehicles, world().jobs, new Date('2026-02-01'));
});

Then('PM readiness for vehicle {string} should be {string}', function (id: string, cls: string) {
  assert.equal(world().readiness.get(id), cls);
});

Then('PM compliance percent should be {int}', function (pct: number) {
  assert.equal(world().pmPct, pct);
});
