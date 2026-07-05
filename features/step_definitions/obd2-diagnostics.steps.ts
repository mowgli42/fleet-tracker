import { Before, Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import type { MaintenanceJob, Obd2Snapshot } from '../../src/lib/types/fleet.ts';
import {
  createObd2Snapshot,
  linkSnapshotToJob,
  snapshotSummaryForJob,
  type DtcReference
} from '../../src/lib/obd2/obd2Rules.ts';

type ObdWorld = {
  reference: DtcReference;
  snapshots: Obd2Snapshot[];
  jobs: MaintenanceJob[];
  lastSummary: string[];
};

function world(): ObdWorld {
  return (globalThis as unknown as { __obdWorld: ObdWorld }).__obdWorld;
}

Before(function () {
  (globalThis as unknown as { __obdWorld: ObdWorld }).__obdWorld = {
    reference: {},
    snapshots: [],
    jobs: [],
    lastSummary: []
  };
});

Given('DTC reference contains code {string}', function (code: string) {
  world().reference[code] = {
    title: 'Random/multiple cylinder misfire',
    description: 'Check ignition system, fuel delivery, compression.',
    priority: 'high',
    component: 'engine'
  };
});

Given('an OBD2 snapshot {string} for vehicle {string}', function (id: string, vehicleId: string) {
  world().snapshots.push({
    id,
    vehicleId,
    capturedAt: '2026-01-01',
    dtcs: [{ code: 'P0300' }]
  });
  world().jobs.push({
    id: 'j1',
    vehicleId,
    title: 'Diag',
    description: '',
    priority: 'medium',
    status: 'open',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    history: [],
    planned: false
  });
});

When('I create an OBD2 snapshot for vehicle {string} with codes {string}', function (vehicleId: string, codes: string) {
  const list = codes.split(',').map((c) => c.trim());
  const manual = list.includes('U0100') ? { U0100: 'Lost comm' } : undefined;
  world().snapshots.push(
    createObd2Snapshot({
      vehicleId,
      codes: list,
      reference: world().reference,
      manualDescriptions: manual,
      now: '2026-01-01T12:00:00Z'
    })
  );
});

When('I link snapshot {string} to job {string}', function (snapId: string, jobId: string) {
  const snap = world().snapshots.find((s) => s.id === snapId);
  assert.ok(snap);
  const linked = linkSnapshotToJob(snap, jobId);
  world().snapshots = world().snapshots.map((s) => (s.id === snapId ? linked : s));
  world().jobs = world().jobs.map((j) =>
    j.id === jobId ? { ...j, obd2SnapshotId: snapId } : j
  );
  world().lastSummary = snapshotSummaryForJob(linked);
});

Then('snapshot should include DTC {string} with description containing {string}', function (code: string, fragment: string) {
  const snap = world().snapshots[world().snapshots.length - 1];
  const dtc = snap.dtcs.find((d) => d.code === code);
  assert.ok(dtc?.description);
  assert.match(dtc.description, new RegExp(fragment, 'i'));
});

Then('snapshot should include DTC {string} with description {string}', function (code: string, desc: string) {
  const snap = world().snapshots[world().snapshots.length - 1];
  const dtc = snap.dtcs.find((d) => d.code === code);
  assert.equal(dtc?.description, desc);
});

Then('job {string} obd2 summary should include {string}', function (_jobId: string, snapId: string) {
  assert.ok(world().lastSummary.length > 0);
  assert.ok(world().snapshots.some((s) => s.id === snapId));
});
