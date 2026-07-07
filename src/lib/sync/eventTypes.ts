export type EntityType = 'vehicle' | 'maintenance_job' | 'transfer';

export type EventType =
  | 'maintenance_blocked'
  | 'maintenance_cleared'
  | 'pm_risk_set'
  | 'transfer_created'
  | 'transfer_applied';

export interface MaintenanceBlockedPayload {
  vehicleId: string;
  jobId: string;
  priority: string;
  status: string;
}

export interface MaintenanceClearedPayload {
  vehicleId: string;
  jobId: string;
}

export interface PmRiskSetPayload {
  vehicleId: string;
  /** True when next PM / service date is within the at-risk window. */
  active: boolean;
  /** ISO date string for next service when relevant. */
  nextServiceDueIso?: string;
}

export type EventPayload = MaintenanceBlockedPayload | MaintenanceClearedPayload | PmRiskSetPayload | Record<string, unknown>;

export interface EventEnvelope {
  event_id: string;
  site_id: string;
  entity_type: EntityType;
  entity_id: string;
  event_type: EventType;
  event_ts_local: string;
  event_ts_server: string | null;
  actor_id: string;
  idempotency_key: string;
  causal_version: number;
  payload: EventPayload;
}
