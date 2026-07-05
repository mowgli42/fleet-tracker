import type {
  DefectRecord,
  InspectionItem,
  InspectionRecord,
  MaintenanceJob
} from '$lib/types/fleet';
import { createMaintenanceJob } from '$lib/maintenance/maintenanceJobRules';
import { isBlockingJob } from '$lib/sync/emitMaintenance';

export type InspectionSubmitInput = {
  vehicleId: string;
  items: InspectionItem[];
  inspectorRole?: string;
  now?: string;
};

export type InspectionSubmitResult = {
  inspection: InspectionRecord;
  defects: DefectRecord[];
  jobs: MaintenanceJob[];
  blocksAvailability: boolean;
};

function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 11)}`;
}

export function submitInspection(input: InspectionSubmitInput): InspectionSubmitResult {
  const now = input.now ?? new Date().toISOString();
  const date = now.slice(0, 10);
  const passed = input.items.every((i) => i.passed);
  const inspectionId = newId('insp');
  const defects: DefectRecord[] = [];
  const jobs: MaintenanceJob[] = [];

  for (const item of input.items.filter((i) => !i.passed)) {
    const defectId = newId('def');
    const critical = Boolean(item.critical);
    let maintenanceJobId: string | undefined;

    if (critical) {
      const job = createMaintenanceJob(
        {
          vehicleId: input.vehicleId,
          title: `Defect: ${item.label}`,
          planned: false,
          component: 'other',
          serviceType: 'repair'
        },
        date
      );
      job.priority = 'critical';
      job.description = `Auto-created from failed inspection item: ${item.label}`;
      maintenanceJobId = job.id;
      jobs.push(job);
    }

    defects.push({
      id: defectId,
      vehicleId: input.vehicleId,
      inspectionId,
      title: item.label,
      critical,
      maintenanceJobId
    });
  }

  const inspection: InspectionRecord = {
    id: inspectionId,
    vehicleId: input.vehicleId,
    inspectedAt: now,
    inspectorRole: input.inspectorRole,
    items: input.items,
    passed
  };

  const blocksAvailability = jobs.some(isBlockingJob);

  return { inspection, defects, jobs, blocksAvailability };
}

export function exportInspectionsCsv(inspections: InspectionRecord[]): string {
  const header = 'id,vehicleId,inspectedAt,passed,failedItems';
  const rows = inspections.map((i) => {
    const failed = i.items.filter((x) => !x.passed).map((x) => x.label).join('; ');
    return [i.id, i.vehicleId, i.inspectedAt, String(i.passed), `"${failed}"`].join(',');
  });
  return [header, ...rows].join('\n');
}
