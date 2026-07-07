import { Before, Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import type { FleetData } from '../../src/lib/stores/fleetData.ts';
import type { MaintenanceJob, PartOrder, Vehicle } from '../../src/lib/types/fleet.ts';
import {
  criticalOpenJobsForSite,
  criticalPartsForSite,
  isDemoCloudRollup
} from '../../src/lib/cloud/cloudMultiSiteRules.ts';
import { SITES } from '../../src/lib/data/multiSiteDemo.ts';

type CloudWorld = { fleet: FleetData };

function world(): CloudWorld {
  return (globalThis as unknown as { __cloudWorld: CloudWorld }).__cloudWorld;
}

function emptyFleet(): FleetData {
  return { vehicles: [], jobs: [], parts: [], obd2Snapshots: [], inspections: [], defects: [], trackingTokens: [] };
}

Before(function () {
  (globalThis as unknown as { __cloudWorld: CloudWorld }).__cloudWorld = { fleet: emptyFleet() };
});

Given('a critical open job {string} for vehicle {string} at site {string}', function (jobId: string, vehicleId: string, siteId: string) {
  const site = SITES.find((s) => s.id === siteId);
  const v: Vehicle = { id: vehicleId, name: vehicleId, status: 'maintenance' };
  world().fleet.vehicles.push(v);
  const job: MaintenanceJob = {
    id: jobId, vehicleId, title: jobId, description: '', priority: 'critical', status: 'open',
    createdAt: '2026-01-01', updatedAt: '2026-01-01', history: [], planned: false
  };
  world().fleet.jobs.push(job);
});

Given('cloud part order {string} linked to job {string} with status {string}', function (name: string, jobId: string, status: string) {
  const part: PartOrder = {
    id: `po-${name}`, partName: name, quantity: 1, orderDate: '2026-01-01',
    status: status as PartOrder['status'], maintenanceJobId: jobId
  };
  world().fleet.parts.push(part);
});

When('I list critical jobs for site {string}', function (siteId: string) {
  (world() as CloudWorld & { critJobs?: MaintenanceJob[] }).critJobs = criticalOpenJobsForSite(siteId, world().fleet);
});

When('I list critical parts for site {string}', function (siteId: string) {
  (world() as CloudWorld & { critParts?: { partName: string }[] }).critParts = criticalPartsForSite(siteId, world().fleet);
});

Then('cloud rollup should be demo mode', function () {
  assert.equal(isDemoCloudRollup(), true);
});

Then('critical job ids should include {string}', function (id: string) {
  const jobs = (world() as CloudWorld & { critJobs?: MaintenanceJob[] }).critJobs ?? [];
  assert.ok(jobs.some((j) => j.id === id));
});

Then('critical part names should include {string}', function (name: string) {
  const parts = (world() as CloudWorld & { critParts?: { partName: string }[] }).critParts ?? [];
  assert.ok(parts.some((p) => p.partName === name));
});
