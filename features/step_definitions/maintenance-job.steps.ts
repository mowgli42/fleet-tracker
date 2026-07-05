import { Before, Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import type { MaintenanceJob } from '../../src/lib/types/fleet.ts';
import {
  applyJobStatusChange,
  createMaintenanceJob,
  sortJobsTimeline,
  validateJobCreate
} from '../../src/lib/maintenance/maintenanceJobRules.ts';

type JobWorld = { jobs: MaintenanceJob[]; lastError: string | null; timeline: MaintenanceJob[] };

function world(): JobWorld {
  return (globalThis as unknown as { __jobWorld: JobWorld }).__jobWorld;
}

Before(function () {
  (globalThis as unknown as { __jobWorld: JobWorld }).__jobWorld = { jobs: [], lastError: null, timeline: [] };
});

Given('no maintenance jobs exist', function () {
  world().jobs = [];
});

Given('a maintenance job {string} for vehicle {string} with status {string}', function (id: string, vehicleId: string, status: string) {
  world().jobs.push({
    id,
    vehicleId,
    title: 'Test job',
    description: '',
    priority: 'medium',
    status: status as MaintenanceJob['status'],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    history: [],
    planned: false
  });
});

Given('maintenance jobs:', function (table: { hashes: () => Record<string, string>[] }) {
  world().jobs = table.hashes().map((row) => ({
    id: row.id,
    vehicleId: row.vehicleId,
    title: 'Job',
    description: '',
    priority: 'medium' as const,
    status: 'open' as const,
    createdAt: row.createdAt,
    updatedAt: row.createdAt,
    dueDate: row.dueDate,
    history: [],
    planned: false
  }));
});

When('I create a maintenance job for vehicle {string} titled {string}', function (vehicleId: string, title: string) {
  const check = validateJobCreate({ vehicleId, title });
  if (!check.ok) {
    world().lastError = check.message;
    return;
  }
  world().jobs.push(createMaintenanceJob({ vehicleId, title }, '2026-01-01'));
  world().lastError = null;
});

When('I attempt to create a maintenance job without a vehicle titled {string}', function (title: string) {
  const check = validateJobCreate({ vehicleId: '', title });
  world().lastError = check.ok ? null : check.message;
});

When('I change job {string} status to {string}', function (id: string, status: string) {
  const job = world().jobs.find((j) => j.id === id);
  assert.ok(job);
  const next = applyJobStatusChange(job, status as MaintenanceJob['status'], '2026-01-02');
  assert.notEqual(typeof next, 'object' && next && 'ok' in next && next.ok === false, true);
  world().jobs = world().jobs.map((j) => (j.id === id ? (next as MaintenanceJob) : j));
});

When('I sort jobs for timeline view', function () {
  world().timeline = sortJobsTimeline(world().jobs);
});

Then('a maintenance job should exist for vehicle {string} with status {string}', function (vehicleId: string, status: string) {
  assert.ok(world().jobs.some((j) => j.vehicleId === vehicleId && j.status === status));
});

Then('job creation should be rejected with message containing {string}', function (fragment: string) {
  assert.ok(world().lastError);
  assert.match(world().lastError, new RegExp(fragment, 'i'));
});

Then('job {string} status should be {string}', function (id: string, status: string) {
  const job = world().jobs.find((j) => j.id === id);
  assert.ok(job);
  assert.equal(job.status, status);
});

Then('job {string} should have completedAt set', function (id: string) {
  const job = world().jobs.find((j) => j.id === id);
  assert.ok(job?.completedAt);
});

Then('timeline job ids should be {string}', function (expected: string) {
  assert.equal(world().timeline.map((j) => j.id).join(','), expected);
});
