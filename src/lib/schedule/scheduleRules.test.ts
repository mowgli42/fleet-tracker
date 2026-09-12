import { describe, expect, it } from 'vitest';
import type { MaintenanceJob, Vehicle } from '$lib/types/fleet';
import {
  HOUR_MS,
  buildFleetSchedule,
  buildVehicleSchedule,
  segmentOffsetPct,
  segmentWidthPct
} from './scheduleRules';

const now = Date.parse('2026-08-21T10:00:00Z');

function vehicle(partial: Partial<Vehicle> & Pick<Vehicle, 'id' | 'name' | 'status'>): Vehicle {
  return partial;
}

function job(partial: Partial<MaintenanceJob> & Pick<MaintenanceJob, 'id' | 'vehicleId' | 'title' | 'planned'>): MaintenanceJob {
  return {
    description: '',
    priority: 'medium',
    status: 'open',
    createdAt: '2026-08-20',
    updatedAt: '2026-08-20',
    history: [],
    ...partial
  };
}

describe('buildVehicleSchedule', () => {
  it('fills a ready vehicle with available',
    () => {
      const row = buildVehicleSchedule(vehicle({ id: 'v1', name: 'Van 01', status: 'ready' }), [], now, 24);
      expect(row.segments).toHaveLength(1);
      expect(row.segments[0].kind).toBe('available');
      expect(row.nextLabel).toBe('Available');
    }
  );

  it('shows in-use as assigned then available', () => {
    const row = buildVehicleSchedule(
      vehicle({ id: 'v1', name: 'Van 01', status: 'in-use', driver: 'J. Martinez' }),
      [],
      now,
      24
    );
    expect(row.segments[0].kind).toBe('assigned');
    expect(row.segments[0].label).toContain('J. Martinez');
    expect(row.segments[1].kind).toBe('available');
  });

  it('shows reserved as relocation then available', () => {
    const row = buildVehicleSchedule(vehicle({ id: 'v8', name: 'Van 04', status: 'reserved' }), [], now, 24);
    expect(row.segments[0].kind).toBe('relocation');
    expect(row.segments[1].kind).toBe('available');
  });

  it('places unplanned work first as unscheduled maintenance', () => {
    const row = buildVehicleSchedule(
      vehicle({ id: 'v3', name: 'Van 03', status: 'maintenance' }),
      [job({ id: 'mj1', vehicleId: 'v3', title: 'Brake pad replacement', planned: false, laborHoursActual: 2 })],
      now,
      72
    );
    expect(row.segments[0].kind).toBe('unscheduled_maint');
    expect(row.segments[0].label).toBe('Brake pad replacement');
    expect(row.segments[0].jobId).toBe('mj1');
  });

  it('pushes scheduled PM after unscheduled work so deferral is visible', () => {
    const row = buildVehicleSchedule(
      vehicle({ id: 'v9', name: 'Sedan 03', status: 'maintenance' }),
      [
        job({ id: 'mj2', vehicleId: 'v9', title: 'Oil leak', planned: false, laborHoursActual: 4 }),
        job({ id: 'mj6', vehicleId: 'v9', title: 'Tire rotation', planned: true, dueDate: '2026-03-12' })
      ],
      now,
      72
    );
    const red = row.segments.find((s) => s.kind === 'unscheduled_maint');
    const yellow = row.segments.find((s) => s.kind === 'scheduled_maint');
    expect(red).toBeTruthy();
    expect(yellow).toBeTruthy();
    expect(yellow!.startMs).toBeGreaterThanOrEqual(red!.endMs);
    expect(row.canDeferScheduled).toBe(true);
    expect(row.nextLabel).toBe('Oil leak');
  });
});

describe('buildFleetSchedule', () => {
  it('groups vehicles by site', () => {
    const groups = buildFleetSchedule(
      [
        vehicle({ id: 'v1', name: 'Van 01', status: 'ready' }),
        vehicle({ id: 'v5', name: 'Sedan 02', status: 'ready' }),
        vehicle({ id: 'v8', name: 'Van 04', status: 'reserved' })
      ],
      [],
      now,
      48
    );
    expect(groups.map((g) => g.siteName)).toEqual(['North Bay', 'South Loop', 'Central Depot']);
    expect(groups[0].vehicles.map((v) => v.vehicleId)).toEqual(['v1']);
  });
});

describe('segment geometry', () => {
  it('maps a 12h block in a 24h window to 50%', () => {
    expect(segmentWidthPct(now, now + 12 * HOUR_MS, 24)).toBe(50);
    expect(segmentOffsetPct(now + 12 * HOUR_MS, now, 24)).toBe(50);
  });
});
