import type { FleetData } from '$lib/stores/fleetData';
import type { MaintenanceJob, PartOrder } from '$lib/types/fleet';
import { SITES, type SiteInfo, vehiclesForSite, jobsForSite } from '$lib/data/multiSiteDemo';
import { criticalPartsFromOrders } from '$lib/parts/partsInventoryRules';

export const CLOUD_DEMO_DISCLAIMER =
  'Illustrative demo rollup from local fleet store — not converged global sync projection.';

export function listDemoSites(): SiteInfo[] {
  return SITES;
}

export function siteVehicleStatusBreakdown(siteId: string, fleet: FleetData): Record<string, number> {
  const vehicles = vehiclesForSite(siteId, fleet);
  return vehicles.reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] ?? 0) + 1;
    return acc;
  }, {});
}

export function criticalOpenJobsForSite(siteId: string, fleet: FleetData): MaintenanceJob[] {
  return jobsForSite(siteId, fleet).filter(
    (j) => j.priority === 'critical' && j.status !== 'completed'
  );
}

export function criticalPartsForSite(
  siteId: string,
  fleet: FleetData
): { partName: string; jobId: string; status: PartOrder['status'] }[] {
  const siteJobIds = new Set(jobsForSite(siteId, fleet).map((j) => j.id));
  return criticalPartsFromOrders(fleet.parts, fleet.jobs).filter((p) => siteJobIds.has(p.jobId));
}

export function isDemoCloudRollup(): boolean {
  return true;
}

export function siteCardSummary(siteId: string, fleet: FleetData): {
  vehicleCount: number;
  criticalJobs: number;
} {
  const vehicles = vehiclesForSite(siteId, fleet);
  const criticalJobs = criticalOpenJobsForSite(siteId, fleet).length;
  return { vehicleCount: vehicles.length, criticalJobs };
}
