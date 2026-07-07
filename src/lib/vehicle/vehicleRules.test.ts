import { describe, expect, it } from 'vitest';
import type { Vehicle } from '$lib/types/fleet';
import {
  filterVehicles,
  findVehicleByVin,
  registerVehicle,
  validateStatusChange,
  validateVehicleRegistration
} from './vehicleRules';

const baseFleet: Vehicle[] = [
  { id: 'v1', name: 'Van 01', status: 'ready', vin: '1HGBH41JXMN109186' },
  { id: 'v2', name: 'Van 02', status: 'maintenance' }
];

describe('validateVehicleRegistration', () => {
  it('rejects duplicate id', () => {
    const r = validateVehicleRegistration(baseFleet, { name: 'X' }, 'v1');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/ID already exists/i);
  });

  it('rejects duplicate VIN case-insensitively', () => {
    const r = validateVehicleRegistration(baseFleet, { name: 'X', vin: '1hgbh41jxmn109186' }, 'v9');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/VIN already exists/i);
  });
});

describe('registerVehicle', () => {
  it('creates vehicle when valid', () => {
    const r = registerVehicle(baseFleet, { name: 'New', status: 'ready' }, 'v3');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.vehicle.name).toBe('New');
  });
});

describe('validateStatusChange', () => {
  it('requires driver for in-use', () => {
    const r = validateStatusChange('in-use', '', false);
    expect(r.ok).toBe(false);
  });

  it('blocks release with open job', () => {
    const r = validateStatusChange('ready', 'Alex', true);
    expect(r.ok).toBe(false);
  });
});

describe('filterVehicles', () => {
  it('filters by status and query', () => {
    expect(filterVehicles(baseFleet, { status: 'ready' }).map((v) => v.id)).toEqual(['v1']);
    expect(filterVehicles(baseFleet, { query: '109186' }).map((v) => v.id)).toEqual(['v1']);
  });
});

describe('findVehicleByVin', () => {
  it('normalizes case', () => {
    expect(findVehicleByVin(baseFleet, '1hgbh41jxmn109186')?.id).toBe('v1');
  });
});
