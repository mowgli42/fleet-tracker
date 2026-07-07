import type { MaintenanceJob, PartOrder, PartOrderStatus } from '$lib/types/fleet';
import type { ValidationResult } from '$lib/vehicle/vehicleRules';

export type PartOrderCreateInput = {
  partName: string;
  quantity: number;
  orderDate: string;
  maintenanceJobId?: string;
  expectedDelivery?: string;
};

const STATUS_ORDER: PartOrderStatus[] = ['ordered', 'shipped', 'received'];

export function validatePartOrderCreate(input: PartOrderCreateInput): ValidationResult {
  if (!input.partName.trim()) {
    return { ok: false, message: 'Part name is required.' };
  }
  if (!input.quantity || input.quantity < 1) {
    return { ok: false, message: 'Quantity must be at least 1.' };
  }
  return { ok: true };
}

export function createPartOrder(input: PartOrderCreateInput, id?: string): PartOrder {
  return {
    id: id ?? 'po-' + Math.random().toString(36).slice(2, 11),
    partName: input.partName.trim(),
    quantity: input.quantity,
    orderDate: input.orderDate,
    status: 'ordered',
    maintenanceJobId: input.maintenanceJobId,
    expectedDelivery: input.expectedDelivery?.trim() || undefined
  };
}

export function advancePartStatus(
  part: PartOrder,
  to: PartOrderStatus,
  now = new Date().toISOString().slice(0, 10)
): PartOrder | { ok: false; message: string } {
  const fromIdx = STATUS_ORDER.indexOf(part.status);
  const toIdx = STATUS_ORDER.indexOf(to);
  if (toIdx < fromIdx) {
    return { ok: false, message: `Cannot move part status from ${part.status} to ${to}.` };
  }
  return {
    ...part,
    status: to,
    receivedAt: to === 'received' ? part.receivedAt ?? now : part.receivedAt
  };
}

export function partsForJob(parts: PartOrder[], jobId: string): PartOrder[] {
  return parts.filter((p) => p.maintenanceJobId === jobId);
}

export function allLinkedPartsReceived(parts: PartOrder[], jobId: string): boolean {
  const linked = partsForJob(parts, jobId);
  if (linked.length === 0) return true;
  return linked.every((p) => p.status === 'received');
}

/** When all linked parts are received, job may leave waiting-parts. */
export function jobAfterPartsReceived(
  job: MaintenanceJob,
  parts: PartOrder[],
  now = new Date().toISOString().slice(0, 10)
): MaintenanceJob | null {
  if (job.status !== 'waiting-parts') return null;
  if (!allLinkedPartsReceived(parts, job.id)) return null;
  return {
    ...job,
    status: 'in-progress',
    updatedAt: now,
    history: [...job.history, { date: now, note: 'All linked parts received.', status: 'in-progress' }]
  };
}

export function criticalPartsFromOrders(
  parts: PartOrder[],
  jobs: MaintenanceJob[]
): { partName: string; jobId: string; status: PartOrderStatus }[] {
  const criticalJobIds = new Set(
    jobs.filter((j) => j.priority === 'critical' && j.status !== 'completed').map((j) => j.id)
  );
  return parts
    .filter(
      (p) =>
        p.maintenanceJobId &&
        criticalJobIds.has(p.maintenanceJobId) &&
        (p.status === 'ordered' || p.status === 'shipped')
    )
    .map((p) => ({ partName: p.partName, jobId: p.maintenanceJobId!, status: p.status }));
}
