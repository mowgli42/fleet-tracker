import type { Vehicle, VehicleStatus } from '$lib/types/fleet';

export type VehicleRegistrationInput = {
  id?: string;
  name: string;
  status?: VehicleStatus;
  vin?: string;
  role?: Vehicle['role'];
  odometer?: number;
};

export type ValidationResult = { ok: true } | { ok: false; message: string };

function normalizeVin(vin: string | undefined): string | undefined {
  const t = vin?.trim();
  return t ? t.toUpperCase() : undefined;
}

export function findVehicleByVin(vehicles: Vehicle[], vin: string | undefined, excludeId?: string): Vehicle | undefined {
  const norm = normalizeVin(vin);
  if (!norm) return undefined;
  return vehicles.find((v) => v.id !== excludeId && normalizeVin(v.vin) === norm);
}

export function validateVehicleRegistration(
  vehicles: Vehicle[],
  input: VehicleRegistrationInput,
  resolvedId: string
): ValidationResult {
  if (!input.name.trim()) {
    return { ok: false, message: 'Name is required.' };
  }
  if (vehicles.some((v) => v.id === resolvedId)) {
    return { ok: false, message: 'A vehicle with this ID already exists.' };
  }
  const dupVin = findVehicleByVin(vehicles, input.vin);
  if (dupVin) {
    return { ok: false, message: 'A vehicle with this VIN already exists.' };
  }
  return { ok: true };
}

export function validateStatusChange(
  status: VehicleStatus,
  driver: string | undefined,
  hasOpenJob: boolean
): ValidationResult {
  if (status === 'in-use' && !driver?.trim()) {
    return { ok: false, message: 'Driver is required when status is in-use.' };
  }
  if (hasOpenJob && status === 'ready') {
    return { ok: false, message: 'Cannot release vehicle while an open maintenance job exists.' };
  }
  return { ok: true };
}

export function filterVehicles(
  vehicles: Vehicle[],
  options: { status?: string; query?: string }
): Vehicle[] {
  let result = vehicles;
  const status = options.status?.trim();
  if (status) {
    result = result.filter((v) => v.status === status);
  }
  const q = options.query?.trim().toLowerCase();
  if (q) {
    result = result.filter((v) => {
      const name = v.name.toLowerCase();
      const vin = (v.vin ?? '').toLowerCase();
      return name.includes(q) || vin.includes(q);
    });
  }
  return result;
}

export function registerVehicle(
  vehicles: Vehicle[],
  input: VehicleRegistrationInput,
  resolvedId: string
): { ok: true; vehicle: Vehicle } | { ok: false; message: string } {
  const check = validateVehicleRegistration(vehicles, input, resolvedId);
  if (!check.ok) return check;
  const vehicle: Vehicle = {
    id: resolvedId,
    name: input.name.trim(),
    status: input.status ?? 'ready',
    role: input.role,
    odometer: input.odometer,
    vin: normalizeVin(input.vin)
  };
  return { ok: true, vehicle };
}
