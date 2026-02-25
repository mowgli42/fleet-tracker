export type VehicleStatus =
  | 'in-use'
  | 'ready'
  | 'maintenance'
  | 'out-of-service'
  | 'reserved';

export type JobPriority = 'low' | 'medium' | 'high' | 'critical';

export type JobStatus =
  | 'open'
  | 'in-progress'
  | 'waiting-parts'
  | 'completed';

export type PartOrderStatus = 'ordered' | 'shipped' | 'received';

export type VehicleRole = 'primary' | 'backup' | 'pool';

export interface Vehicle {
  id: string;
  name: string;
  status: VehicleStatus;
  lastService?: string;
  nextService?: string;
  odometer?: number;
  driver?: string;
  /** For TOC prioritization: impact on availability */
  role?: VehicleRole;
  /** Odometer at last completed service (for MTBF/trends) */
  odometerAtLastService?: number;
}

export interface MaintenanceJobHistoryEntry {
  date: string;
  note: string;
  status?: JobStatus;
}

export interface MaintenanceJob {
  id: string;
  vehicleId: string;
  title: string;
  description: string;
  priority: JobPriority;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  history: MaintenanceJobHistoryEntry[];
  partsRequired?: string[];
  /** Scheduled (PM) vs unplanned (breakdown/defect) */
  planned: boolean;
  /** Component/system for repair trend and configuration (e.g. brakes, engine, electrical) */
  component?: string;
  /** Failure/defect code (internal or VMRS-style) */
  failureCode?: string;
  /** When work actually started (for MTTR / time-in-state) */
  startedAt?: string;
  /** When job was completed */
  completedAt?: string;
  /** Required-by date for prioritization (TOC) */
  dueDate?: string;
  /** Actual labor hours (capacity/cost) */
  laborHoursActual?: number;
  /** Assigned technician or bay (TOC capacity) */
  assignedTo?: string;
  /** When/how fault was first reported (andon) */
  reportedAt?: string;
  reportedBy?: string;
  /** Odometer at job open (for MTBF) */
  odometerAtJobOpen?: number;
}

export interface PartOrder {
  id: string;
  partName: string;
  quantity: number;
  orderDate: string;
  expectedDelivery?: string;
  status: PartOrderStatus;
  maintenanceJobId?: string;
  /** When part was received (for lead time) */
  receivedAt?: string;
  /** Quantity used on linked job (configuration / cost) */
  quantityUsed?: number;
}
