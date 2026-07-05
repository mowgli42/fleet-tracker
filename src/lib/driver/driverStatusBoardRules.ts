import type { DriverTrackingToken, MaintenanceJob, Vehicle } from '$lib/types/fleet';

export function generateTrackingToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, '');
  }
  return `tok-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function createTrackingToken(
  vehicleId: string,
  driverName?: string,
  now = new Date().toISOString()
): DriverTrackingToken {
  return {
    token: generateTrackingToken(),
    vehicleId,
    driverName,
    createdAt: now
  };
}

export function resolveTrackingToken(
  token: string,
  tokens: DriverTrackingToken[]
): DriverTrackingToken | null {
  const norm = token.trim();
  if (!norm) return null;
  return tokens.find((t) => t.token === norm) ?? null;
}

export type DriverStatusView = {
  vehicleName: string;
  jobTitle: string | null;
  jobStatus: string | null;
  statusText: string;
  readOnly: true;
};

const STATUS_COPY: Record<string, string> = {
  open: 'Your vehicle is in the shop queue.',
  'in-progress': 'Maintenance is in progress.',
  'waiting-parts': 'We are waiting on parts for your vehicle.',
  completed: 'Maintenance is complete.',
  ready: 'Your vehicle is ready.',
  maintenance: 'Your vehicle is in for maintenance.'
};

export function buildDriverStatusView(
  vehicle: Vehicle | undefined,
  job: MaintenanceJob | undefined
): DriverStatusView | null {
  if (!vehicle) return null;
  const jobStatus = job?.status ?? null;
  const statusText =
    (jobStatus && STATUS_COPY[jobStatus]) ||
    STATUS_COPY[vehicle.status] ||
    'Status update available.';
  return {
    vehicleName: vehicle.name,
    jobTitle: job?.title ?? null,
    jobStatus,
    statusText,
    readOnly: true
  };
}

export function isTokenEnumerableGuess(token: string): boolean {
  return /^\d+$/.test(token.trim());
}
