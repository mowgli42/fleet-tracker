import { Before, Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import type { MaintenanceJob, Vehicle } from '../../src/lib/types/fleet.ts';
import {
  completeTabletIntake,
  incompleteCriticalChecklist,
  searchVehiclesForIntake,
  type IntakeChecklist
} from '../../src/lib/tablet/tabletShopFloorRules.ts';

type IntakeWorld = { vehicles: Vehicle[]; jobs: MaintenanceJob[]; result?: ReturnType<typeof completeTabletIntake>; warnings: string[] };

function world(): IntakeWorld {
  return (globalThis as unknown as { __intakeWorld: IntakeWorld }).__intakeWorld;
}

Before(function () {
  (globalThis as unknown as { __intakeWorld: IntakeWorld }).__intakeWorld = { vehicles: [], jobs: [], warnings: [] };
});

Given('intake vehicles:', function (table: { hashes: () => Record<string, string>[] }) {
  world().vehicles = table.hashes().map((row) => ({
    id: row.id, name: row.name, status: 'ready' as const, vin: row.vin
  }));
});

Given('intake vehicle {string} with status {string}', function (id: string, status: string) {
  world().vehicles = [{ id, name: id, status: status as Vehicle['status'] }];
});

Given('an intake checklist with brakes unchecked', function () {
  const c: IntakeChecklist = { tires: true, lights: true, fluids: true, brakes: false, body: true };
  world().warnings = incompleteCriticalChecklist(c);
});

When('I search intake for {string}', function (q: string) {
  (world() as IntakeWorld & { search?: Vehicle[] }).search = searchVehiclesForIntake(world().vehicles, q);
});

When('I complete intake with pull for service and issue {string}', function (title: string) {
  const v = world().vehicles[0];
  world().result = completeTabletIntake({
    vehicle: v,
    jobs: world().jobs,
    checklist: { tires: true, lights: true, fluids: true, brakes: true, body: true },
    flagMaintenance: true,
    issueTitle: title,
    pullForService: true,
    now: '2026-01-01'
  });
});

Then('intake search results should be {string}', function (expected: string) {
  const ids = ((world() as IntakeWorld & { search?: Vehicle[] }).search ?? []).map((v) => v.id).join(',');
  assert.equal(ids, expected);
});

Then('intake vehicle {string} status should be {string}', function (id: string, status: string) {
  assert.equal(world().result?.vehicle.id === id && world().result.vehicle.status, status);
});

Then('intake should have created a job for {string}', function (vehicleId: string) {
  assert.ok(world().result?.jobs.some((j) => j.vehicleId === vehicleId));
});

Then('intake critical warnings should include {string}', function (label: string) {
  assert.ok(world().warnings.includes(label));
});
