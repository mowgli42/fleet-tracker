import { Before, Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import type { FleetData } from '../../src/lib/stores/fleetData.ts';
import type { MaintenanceJob, PartOrder, Vehicle, VehicleStatus } from '../../src/lib/types/fleet.ts';
import { computeDashboardData } from '../../src/lib/utils/dashboardSummary.ts';

type DashWorld = { fleet: FleetData; data: ReturnType<typeof computeDashboardData> | null };

function world(): DashWorld {
  return (globalThis as unknown as { __dashWorld: DashWorld }).__dashWorld;
}

Before(function () {
  (globalThis as unknown as { __dashWorld: DashWorld }).__dashWorld = {
    fleet: { vehicles: [], jobs: [], parts: [], obd2Snapshots: [] },
    data: null
  };
});

Given('vehicles:', function (table: { hashes: () => Record<string, string>[] }) {
  world().fleet.vehicles = table.hashes().map((row) => ({
    id: row.id,
    name: row.id,
    status: row.status as VehicleStatus
  }));
});

Given('completed jobs:', function (table: { hashes: () => Record<string, string>[] }) {
  world().fleet.jobs = table.hashes().map((row) => ({
    id: row.id,
    vehicleId: 'v1',
    title: 'Job',
    description: '',
    priority: 'medium' as const,
    status: 'completed' as const,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    completedAt: '2026-01-02',
    history: [],
    planned: row.planned === 'true'
  }));
});

Given('parts:', function (table: { hashes: () => Record<string, string>[] }) {
  world().fleet.parts = table.hashes().map((row) => ({
    id: row.id,
    partName: row.id,
    quantity: 1,
    orderDate: '2026-01-01',
    status: row.status as PartOrder['status']
  }));
});

When('I compute dashboard metrics', function () {
  world().data = computeDashboardData(world().fleet);
});

Then('fleet availability percent should be {int}', function (pct: number) {
  assert.equal(world().data?.availabilityPct, pct);
});

Then('unplanned percent should be {int}', function (pct: number) {
  assert.equal(world().data?.unplannedPct, pct);
});

Then('parts by status received count should be {int}', function (count: number) {
  assert.equal(world().data?.summary.partsByStatus.received ?? 0, count);
});
