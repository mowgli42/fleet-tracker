import type { MaintenanceJob } from '$lib/types/fleet';
import { createEvent } from './createEvent';
import { appendAndQueueEvent } from './syncPipeline';

const ACTOR = 'local-operator';

/** Blocking maintenance for demo: critical open work or waiting on parts. */
export function isBlockingJob(job: MaintenanceJob): boolean {
  if (job.status === 'completed') return false;
  return job.priority === 'critical' || job.status === 'waiting-parts';
}

/**
 * Emit sync events when maintenance job blocking state changes.
 * Call after fleet data has been updated (new job shape).
 */
export function emitMaintenanceJobDelta(prev: MaintenanceJob | null, next: MaintenanceJob): void {
  if (typeof window === 'undefined') return;

  const vehicleId = next.vehicleId;
  const prevBlock = prev != null && isBlockingJob(prev);
  const nextBlock = isBlockingJob(next);

  if (prevBlock === nextBlock) return;

  if (nextBlock) {
    appendAndQueueEvent(
      createEvent({
        entity_type: 'maintenance_job',
        entity_id: next.id,
        event_type: 'maintenance_blocked',
        actor_id: ACTOR,
        payload: {
          vehicleId,
          jobId: next.id,
          priority: next.priority,
          status: next.status
        }
      })
    );
  } else {
    appendAndQueueEvent(
      createEvent({
        entity_type: 'maintenance_job',
        entity_id: next.id,
        event_type: 'maintenance_cleared',
        actor_id: ACTOR,
        payload: { vehicleId, jobId: next.id }
      })
    );
  }
}
