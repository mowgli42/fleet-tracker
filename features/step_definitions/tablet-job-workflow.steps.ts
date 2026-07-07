import { Before, Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import type { MaintenanceJob, PartOrder } from '../../src/lib/types/fleet.ts';
import {
  canCompleteReturnToService,
  canStartShopWork,
  emptyRtsChecklist
} from '../../src/lib/tablet/tabletJobWorkflowRules.ts';

type TabletWorld = { job: MaintenanceJob | null; parts: PartOrder[]; canStart: boolean; canComplete: boolean };

function world(): TabletWorld {
  return (globalThis as unknown as { __tabletWorld: TabletWorld }).__tabletWorld;
}

Before(function () {
  (globalThis as unknown as { __tabletWorld: TabletWorld }).__tabletWorld = {
    job: null,
    parts: [],
    canStart: false,
    canComplete: false
  };
});

Given('a tablet job {string} with status {string}', function (id: string, status: string) {
  world().job = {
    id,
    vehicleId: 'v1',
    title: 'Tablet job',
    description: '',
    priority: 'medium',
    status: status as MaintenanceJob['status'],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    history: [],
    planned: false
  };
});

Given('a tablet part order {string} linked to job {string} with status {string}', function (partId: string, jobId: string, status: string) {
  world().parts.push({
    id: partId,
    partName: partId,
    quantity: 1,
    orderDate: '2026-01-01',
    status: status as PartOrder['status'],
    maintenanceJobId: jobId
  });
});

Given('all parts received for job {string}', function (jobId: string) {
  world().parts = [
    {
      id: 'po1',
      partName: 'Part',
      quantity: 1,
      orderDate: '2026-01-01',
      status: 'received',
      maintenanceJobId: jobId,
      receivedAt: '2026-01-02'
    }
  ];
});

When('I evaluate shop work eligibility without override', function () {
  assert.ok(world().job);
  world().canStart = canStartShopWork(world().job, world().parts, false);
});

When('the RTS checklist is incomplete', function () {
  assert.ok(world().job);
  world().canComplete = canCompleteReturnToService(world().job, emptyRtsChecklist());
});

When('the RTS checklist is complete', function () {
  assert.ok(world().job);
  const full = emptyRtsChecklist();
  for (const k of Object.keys(full) as (keyof typeof full)[]) full[k] = true;
  world().canComplete = canCompleteReturnToService(world().job, full);
});

Then('shop work should not be startable', function () {
  assert.equal(world().canStart, false);
});

Then('shop work should be startable', function () {
  assert.equal(world().canStart, true);
});

Then('return to service should be blocked', function () {
  assert.equal(world().canComplete, false);
});

Then('return to service should be allowed', function () {
  assert.equal(world().canComplete, true);
});
