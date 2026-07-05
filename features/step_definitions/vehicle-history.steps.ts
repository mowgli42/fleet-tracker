import { Before, Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import type { MaintenanceJob, Vehicle } from '../../src/lib/types/fleet.ts';
import {
  buildVehicleHistory,
  isCurrentOpenJob,
  odometerDisplayForJob
} from '../../src/lib/history/vehicleHistoryRules.ts';

type HistWorld = { jobs: MaintenanceJob[]; vehicle?: Vehicle; entries: ReturnType<typeof buildVehicleHistory> };

function world(): HistWorld {
  return (globalThis as unknown as { __histWorld: HistWorld }).__histWorld;
}

Before(function () {
  (globalThis as unknown as { __histWorld: HistWorld }).__histWorld = { jobs: [], entries: [] };
});

Given('history jobs for vehicle {string}:', function (vehicleId: string, table: { hashes: () => Record<string, string>[] }) {
  world().jobs = table.hashes().map((row) => ({
    id: row.id,
    vehicleId,
    title: row.id,
    description: '',
    priority: 'medium' as const,
    status: (row.status ?? 'completed') as MaintenanceJob['status'],
    createdAt: row.createdAt ?? '2026-01-01',
    updatedAt: row.createdAt ?? '2026-01-01',
    completedAt: row.completedAt || undefined,
    history: [],
    planned: false
  }));
});

Given('vehicle {string} current job is {string}', function (id: string, jobId: string) {
  world().vehicle = { id, name: id, status: 'maintenance', currentJobId: jobId };
});

Given('a history job {string} with odometer open {int} and completion {int}', function (id: string, open: number, done: number) {
  world().jobs = [{
    id, vehicleId: 'v1', title: id, description: '', priority: 'medium', status: 'completed',
    createdAt: '2026-01-01', updatedAt: '2026-01-02', completedAt: '2026-01-02',
    odometerAtJobOpen: open, odometerAtCompletion: done, history: [], planned: false
  }];
});

When('I build vehicle history for {string} newest first', function (vehicleId: string) {
  world().entries = buildVehicleHistory(vehicleId, world().jobs, [], world().vehicle?.currentJobId);
});

When('I display odometer for job {string}', function (id: string) {
  const job = world().jobs.find((j) => j.id === id);
  (world() as HistWorld & { odo?: string | null }).odo = job ? odometerDisplayForJob(job) : null;
});

Then('history job ids should be {string}', function (expected: string) {
  const ids = world().entries.filter((e) => e.kind === 'job').map((e) => (e.kind === 'job' ? e.job.id : '')).join(',');
  assert.equal(ids, expected);
});

Then('history marks job {string} as current open', function (id: string) {
  const entry = world().entries.find((e) => e.kind === 'job' && e.job.id === id);
  assert.ok(entry && entry.kind === 'job' && entry.isCurrentOpen);
  const job = world().jobs.find((j) => j.id === id)!;
  assert.ok(isCurrentOpenJob(job, world().vehicle?.currentJobId));
});

Then('odometer display should prefer completion {int}', function (val: number) {
  assert.equal((world() as HistWorld & { odo?: string }).odo, String(val));
});
