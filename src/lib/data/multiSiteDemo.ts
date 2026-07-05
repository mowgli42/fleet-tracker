import type { FleetData } from '$lib/stores/fleetData';
import type { MaintenanceJob, Vehicle } from '$lib/types/fleet';

export type SiteInfo = {
  id: string;
  name: string;
  region: string;
  /** Vehicle ids assigned to this site for multi-site rollup (demo partition). */
  vehicleIds: string[];
};

export const SITES: SiteInfo[] = [
  { id: 'site-north', name: 'North Bay', region: 'US-West', vehicleIds: ['v1', 'v2', 'v3', 'v4'] },
  { id: 'site-south', name: 'South Loop', region: 'US-Central', vehicleIds: ['v5', 'v6', 'v7'] },
  { id: 'site-central', name: 'Central Depot', region: 'US-East', vehicleIds: ['v8', 'v9', 'v10'] }
];

export function vehiclesForSite(siteId: string, fleet: FleetData): Vehicle[] {
  const site = SITES.find((s) => s.id === siteId);
  if (!site) return [];
  const set = new Set(site.vehicleIds);
  return fleet.vehicles.filter((v) => set.has(v.id));
}

export function jobsForSite(siteId: string, fleet: FleetData): MaintenanceJob[] {
  const ids = new Set(vehiclesForSite(siteId, fleet).map((v) => v.id));
  return fleet.jobs.filter((j) => ids.has(j.vehicleId));
}

export function readyForAssignmentCount(siteId: string, fleet: FleetData): number {
  return vehiclesForSite(siteId, fleet).filter((v) => v.status === 'ready').length;
}

export type SiteHealthRollup = {
  site: SiteInfo;
  ready: number;
  inMaintenance: number;
  blocked: number;
  /** In use — not in the assignment pool */
  inUse: number;
  reserved: number;
  /** All vehicles attributed to this site */
  totalVehicles: number;
  openCriticalJobs: number;
};

export function siteHealthRollup(fleet: FleetData): SiteHealthRollup[] {
  return SITES.map((site) => {
    const veh = vehiclesForSite(site.id, fleet);
    const jobs = jobsForSite(site.id, fleet);
    const openCrit = jobs.filter((j) => j.priority === 'critical' && j.status !== 'completed').length;
    return {
      site,
      ready: veh.filter((v) => v.status === 'ready').length,
      inMaintenance: veh.filter((v) => v.status === 'maintenance').length,
      blocked: veh.filter((v) => v.status === 'out-of-service').length,
      inUse: veh.filter((v) => v.status === 'in-use').length,
      reserved: veh.filter((v) => v.status === 'reserved').length,
      totalVehicles: veh.length,
      openCriticalJobs: openCrit
    };
  });
}

export type CriticalPartRow = {
  label: string;
  sites: string[];
  openJobCount: number;
};

/** Aggregate parts from open jobs' partsRequired across sites (demo heuristic). */
export function criticalPartsAcrossSites(fleet: FleetData, minJobs = 1): CriticalPartRow[] {
  const open = fleet.jobs.filter((j) => j.status !== 'completed');
  const byPart = new Map<string, { sites: Set<string>; jobs: number }>();

  for (const job of open) {
    const site = SITES.find((s) => s.vehicleIds.includes(job.vehicleId));
    const siteName = site?.name ?? 'Unknown';
    const parts = job.partsRequired ?? [];
    for (const p of parts) {
      const key = p.trim();
      if (!key) continue;
      let row = byPart.get(key);
      if (!row) {
        row = { sites: new Set(), jobs: 0 };
        byPart.set(key, row);
      }
      row.sites.add(siteName);
      row.jobs += 1;
    }
  }

  const rows: CriticalPartRow[] = [];
  for (const [label, v] of byPart) {
    if (v.jobs >= minJobs) {
      rows.push({
        label,
        sites: [...v.sites].sort(),
        openJobCount: v.jobs
      });
    }
  }
  return rows.sort((a, b) => b.openJobCount - a.openJobCount || a.label.localeCompare(b.label));
}

export function siteById(siteId: string): SiteInfo | undefined {
  return SITES.find((s) => s.id === siteId);
}
