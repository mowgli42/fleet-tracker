import { Before, Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import type { MaintenanceJob, PartOrder } from '../../src/lib/types/fleet.ts';
import {
  advancePartStatus,
  createPartOrder,
  jobAfterPartsReceived,
  partsForJob
} from '../../src/lib/parts/partsInventoryRules.ts';

type PartsWorld = { parts: PartOrder[]; jobs: MaintenanceJob[] };

function world(): PartsWorld {
  return (globalThis as unknown as { __partsWorld: PartsWorld }).__partsWorld;
}

Before(function () {
  (globalThis as unknown as { __partsWorld: PartsWorld }).__partsWorld = { parts: [], jobs: [] };
});

Given('no part orders exist', function () {
  world().parts = [];
});

Given('a maintenance job {string} exists', function (id: string) {
  world().jobs.push({
    id,
    vehicleId: 'v1',
    title: 'Job',
    description: '',
    priority: 'medium',
    status: 'open',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    history: [],
    planned: false
  });
});

Given('a maintenance job {string} with status {string}', function (id: string, status: string) {
  world().jobs.push({
    id,
    vehicleId: 'v1',
    title: 'Job',
    description: '',
    priority: 'medium',
    status: status as MaintenanceJob['status'],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    history: [],
    planned: false
  });
});

Given('part order {string} linked to job {string} with status {string}', function (partId: string, jobId: string, status: string) {
  world().parts.push({
    id: partId,
    partName: partId,
    quantity: 1,
    orderDate: '2026-01-01',
    status: status as PartOrder['status'],
    maintenanceJobId: jobId
  });
});

Given('a part order {string} with status {string}', function (id: string, status: string) {
  world().parts.push({
    id,
    partName: id,
    quantity: 1,
    orderDate: '2026-01-01',
    status: status as PartOrder['status']
  });
});

When('I create a part order {string} quantity {int}', function (name: string, qty: number) {
  world().parts.push(createPartOrder({ partName: name, quantity: qty, orderDate: '2026-01-01' }));
});

When('I create a part order {string} linked to job {string}', function (name: string, jobId: string) {
  world().parts.push(
    createPartOrder({ partName: name, quantity: 1, orderDate: '2026-01-01', maintenanceJobId: jobId })
  );
});

When('I advance part {string} status to {string}', function (id: string, status: string) {
  const part = world().parts.find((p) => p.id === id);
  assert.ok(part);
  const next = advancePartStatus(part, status as PartOrder['status'], '2026-01-02');
  world().parts = world().parts.map((p) => (p.id === id ? (next as PartOrder) : p));
  const linkedJob = world().jobs.find((j) => j.id === part.maintenanceJobId);
  if (linkedJob) {
    const updated = jobAfterPartsReceived(linkedJob, world().parts, '2026-01-02');
    if (updated) {
      world().jobs = world().jobs.map((j) => (j.id === updated.id ? updated : j));
    }
  }
});

Then('a part order {string} should exist with status {string}', function (name: string, status: string) {
  const p = world().parts.find((x) => x.partName === name);
  assert.ok(p);
  assert.equal(p.status, status);
});

Then('part orders for job {string} should include {string}', function (jobId: string, name: string) {
  const linked = partsForJob(world().parts, jobId);
  assert.ok(linked.some((p) => p.partName === name));
});

Then('part {string} status should be {string}', function (id: string, status: string) {
  const p = world().parts.find((x) => x.id === id);
  assert.ok(p);
  assert.equal(p.status, status);
});

Then('part {string} should have receivedAt set', function (id: string) {
  const p = world().parts.find((x) => x.id === id);
  assert.ok(p?.receivedAt);
});

Then('the parts job {string} status should be {string}', function (id: string, status: string) {
  const j = world().jobs.find((x) => x.id === id);
  assert.ok(j);
  assert.equal(j.status, status);
});
