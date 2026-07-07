import { Before, Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import type { FleetData } from '../../src/lib/stores/fleetData.ts';
import type { FleetArchive, MaintenanceJob, Vehicle } from '../../src/lib/types/fleet.ts';
import {
  archiveOldCompletedJobs,
  archiveRetiredVehicle,
  createBackupSnapshot
} from '../../src/lib/lifecycle/dataLifecycleRules.ts';

type LifeWorld = { fleet: FleetData; archive: FleetArchive | null; backup: ReturnType<typeof createBackupSnapshot> | null };

function emptyFleet(): FleetData {
  return { vehicles: [], jobs: [], parts: [], obd2Snapshots: [], inspections: [], defects: [], trackingTokens: [] };
}

function world(): LifeWorld {
  return (globalThis as unknown as { __lifeWorld: LifeWorld }).__lifeWorld;
}

Before(function () {
  (globalThis as unknown as { __lifeWorld: LifeWorld }).__lifeWorld = { fleet: emptyFleet(), archive: null, backup: null };
});

Given('a fleet with {int} vehicles and {int} jobs', function (v: number, j: number) {
  world().fleet.vehicles = Array.from({ length: v }, (_, i) => ({ id: `v${i + 1}`, name: `v${i + 1}`, status: 'ready' as const }));
  world().fleet.jobs = Array.from({ length: j }, (_, i) => ({
    id: `j${i + 1}`, vehicleId: 'v1', title: `j${i + 1}`, description: '', priority: 'medium' as const,
    status: 'open' as const, createdAt: '2026-01-01', updatedAt: '2026-01-01', history: [], planned: false
  }));
});

Given('fleet vehicle {string} with {int} jobs', function (vehicleId: string, n: number) {
  world().fleet.vehicles.push({ id: vehicleId, name: vehicleId, status: 'ready' });
  for (let i = 0; i < n; i++) {
    world().fleet.jobs.push({
      id: `j-${vehicleId}-${i}`, vehicleId, title: 'job', description: '', priority: 'medium', status: 'completed',
      createdAt: '2020-01-01', updatedAt: '2020-01-01', completedAt: '2020-01-01', history: [], planned: false
    });
  }
});

Given('a job {string} completed {int} years ago', function (id: string, years: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  const iso = d.toISOString().slice(0, 10);
  world().fleet.jobs.push({
    id, vehicleId: 'v1', title: id, description: '', priority: 'medium', status: 'completed',
    createdAt: iso, updatedAt: iso, completedAt: iso, history: [], planned: false
  });
});

When('a backup snapshot is created', function () {
  world().backup = createBackupSnapshot(world().fleet);
});

When('vehicle {string} is archived', function (vehicleId: string) {
  const r = archiveRetiredVehicle(world().fleet, vehicleId, world().archive);
  world().fleet = r.fleet;
  world().archive = r.archive;
});

When('retention runs with {int} year window', function (years: number) {
  const r = archiveOldCompletedJobs(world().fleet.jobs, world().archive, years);
  world().fleet.jobs = r.activeJobs;
  world().archive = r.archive;
});

Then('backup should include {int} vehicles and {int} jobs', function (v: number, j: number) {
  assert.equal(world().backup?.vehicles.length, v);
  assert.equal(world().backup?.jobs.length, j);
});

Then('active fleet should not contain {string}', function (id: string) {
  assert.ok(!world().fleet.vehicles.some((v) => v.id === id));
});

Then('archive should contain vehicle {string} with {int} jobs', function (vehicleId: string, n: number) {
  assert.ok(world().archive?.vehicles.some((v) => v.id === vehicleId));
  assert.equal(world().archive?.jobs.filter((j) => j.vehicleId === vehicleId).length, n);
});

Then('active jobs should not include {string}', function (id: string) {
  assert.ok(!world().fleet.jobs.some((j) => j.id === id));
});

Then('archive jobs should include {string}', function (id: string) {
  assert.ok(world().archive?.jobs.some((j) => j.id === id));
});
