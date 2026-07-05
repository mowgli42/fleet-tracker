import type { FleetData } from '$lib/stores/fleetData';
import type { MaintenanceJob, UserRole, Vehicle } from '$lib/types/fleet';

export type FleetAction =
  | 'vehicle:create'
  | 'vehicle:update'
  | 'vehicle:delete'
  | 'job:create'
  | 'job:update'
  | 'parts:update'
  | 'fleet:read';

const ROLE_PERMISSIONS: Record<UserRole, Set<FleetAction>> = {
  admin: new Set([
    'vehicle:create',
    'vehicle:update',
    'vehicle:delete',
    'job:create',
    'job:update',
    'parts:update',
    'fleet:read'
  ]),
  shop_manager: new Set([
    'vehicle:create',
    'vehicle:update',
    'job:create',
    'job:update',
    'parts:update',
    'fleet:read'
  ]),
  technician: new Set(['vehicle:update', 'job:create', 'job:update', 'parts:update', 'fleet:read']),
  driver: new Set(['fleet:read'])
};

export function canPerform(role: UserRole, action: FleetAction): boolean {
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}

export function authorizeAction(
  role: UserRole | null,
  action: FleetAction
): { ok: true } | { ok: false; status: 401 | 403; message: string } {
  if (!role) {
    return { ok: false, status: 401, message: 'Authentication required.' };
  }
  if (!canPerform(role, action)) {
    return { ok: false, status: 403, message: 'Permission denied.' };
  }
  return { ok: true };
}

export function vehiclesForAuthorizedSites(
  vehicles: Vehicle[],
  authorizedSiteVehicleIds: Set<string>
): Vehicle[] {
  return vehicles.filter((v) => authorizedSiteVehicleIds.has(v.id));
}

export function canAccessVehicle(
  vehicleId: string,
  authorizedSiteVehicleIds: Set<string>
): boolean {
  return authorizedSiteVehicleIds.has(vehicleId);
}

export function actorIdForSession(userId: string | null): string {
  return userId?.trim() || 'anonymous';
}

export function driverVisibleVehicles(
  vehicles: Vehicle[],
  assignedVehicleId?: string
): Vehicle[] {
  if (!assignedVehicleId) return [];
  return vehicles.filter((v) => v.id === assignedVehicleId);
}
