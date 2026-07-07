import { Before, Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import type { InspectionRecord } from '../../src/lib/types/fleet.ts';
import { exportInspectionsCsv, submitInspection } from '../../src/lib/inspections/inspectionRules.ts';

type InspWorld = {
  result: ReturnType<typeof submitInspection> | null;
  inspections: InspectionRecord[];
  csv: string;
};

function world(): InspWorld {
  return (globalThis as unknown as { __inspWorld: InspWorld }).__inspWorld;
}

Before(function () {
  (globalThis as unknown as { __inspWorld: InspWorld }).__inspWorld = { result: null, inspections: [], csv: '' };
});

When('I submit a passing inspection for vehicle {string}', function (vehicleId: string) {
  world().result = submitInspection({
    vehicleId,
    items: [
      { id: 'tires', label: 'Tires', passed: true },
      { id: 'brakes', label: 'Brakes', passed: true }
    ],
    now: '2026-01-01T12:00:00Z'
  });
  world().inspections.push(world().result.inspection);
});

When('I submit inspection for {string} with failed item {string} non-critical', function (vehicleId: string, label: string) {
  world().result = submitInspection({
    vehicleId,
    items: [{ id: 'x', label, passed: false, critical: false }],
    now: '2026-01-01T12:00:00Z'
  });
});

When('I submit inspection for {string} with failed critical item {string}', function (vehicleId: string, label: string) {
  world().result = submitInspection({
    vehicleId,
    items: [{ id: 'x', label, passed: false, critical: true }],
    now: '2026-01-01T12:00:00Z'
  });
});

Given('an inspection exists for vehicle {string}', function (vehicleId: string) {
  world().inspections.push({
    id: 'insp-1', vehicleId, inspectedAt: '2026-01-01', passed: true,
    items: [{ id: 'a', label: 'Tires', passed: true }]
  });
});

When('inspections are exported', function () {
  world().csv = exportInspectionsCsv(world().inspections);
});

Then('inspection for {string} should pass', function (vehicleId: string) {
  assert.equal(world().result?.inspection.vehicleId, vehicleId);
  assert.equal(world().result?.inspection.passed, true);
});

Then('inspection for {string} should fail', function (vehicleId: string) {
  assert.equal(world().result?.inspection.passed, false);
});

Then('no defect jobs should be created', function () {
  assert.equal(world().result?.jobs.length, 0);
});

Then('defects should include {string}', function (label: string) {
  assert.ok(world().result?.defects.some((d) => d.title === label));
});

Then('an open job should be created for {string}', function (vehicleId: string) {
  assert.ok(world().result?.jobs.some((j) => j.vehicleId === vehicleId && j.status === 'open'));
});

Then('availability should be blocked', function () {
  assert.equal(world().result?.blocksAvailability, true);
});

Then('export should include header row', function () {
  assert.match(world().csv, /^id,vehicleId/);
});
