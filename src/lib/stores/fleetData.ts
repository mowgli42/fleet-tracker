import { writable } from 'svelte/store';
import type { Vehicle, MaintenanceJob, PartOrder, Obd2Snapshot } from '$lib/types/fleet';
import vehiclesData from '$lib/data/vehicles.json';
import jobsData from '$lib/data/maintenance-jobs.json';
import partsData from '$lib/data/parts-orders.json';

const KEY = 'fleet-tracker-data';

export interface FleetData {
  vehicles: Vehicle[];
  jobs: MaintenanceJob[];
  parts: PartOrder[];
  obd2Snapshots: Obd2Snapshot[];
}

const base: FleetData = {
  vehicles: vehiclesData as Vehicle[],
  jobs: jobsData as MaintenanceJob[],
  parts: partsData as PartOrder[],
  obd2Snapshots: []
};

function loadFromStorage(): FleetData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FleetData;
    if (
      Array.isArray(parsed.vehicles) &&
      Array.isArray(parsed.jobs) &&
      Array.isArray(parsed.parts) &&
      Array.isArray(parsed.obd2Snapshots ?? [])
    ) {
      return {
        vehicles: parsed.vehicles,
        jobs: parsed.jobs,
        parts: parsed.parts,
        obd2Snapshots: parsed.obd2Snapshots ?? []
      };
    }
  } catch (_) {
    /* ignore */
  }
  return null;
}

function getInitial(): FleetData {
  const stored = loadFromStorage();
  return stored ?? { ...base, obd2Snapshots: [] };
}

export const fleetDataStore = writable<FleetData>(base);

/** Call once on client (e.g. layout onMount) to replace store with localStorage data if present. */
export function initFleetDataFromStorage(): void {
  if (typeof window === 'undefined') return;
  const stored = loadFromStorage();
  if (stored) fleetDataStore.set(stored);
}

/** Persist current data to localStorage. Call after any edit. */
export function saveFleetData(data: FleetData): void {
  fleetDataStore.set(data);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  }
}

/** Get base data for SSR / initial load (no localStorage). */
export function getBaseFleetData(): FleetData {
  return { ...base, obd2Snapshots: [] };
}

// On client, sync from localStorage as soon as store module is evaluated
if (typeof window !== 'undefined') {
  const stored = loadFromStorage();
  if (stored) fleetDataStore.set(stored);
}
