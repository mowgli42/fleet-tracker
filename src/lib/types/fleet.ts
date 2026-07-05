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
  /** Phase 1: lifecycle timestamps */
  intakeAt?: string;
  checkedOutAt?: string;
  releasedAt?: string;
  /** Active maintenance job when status is maintenance */
  currentJobId?: string;
  /** Optional in Phase 1; required for production/VIN scan */
  vin?: string;
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
  /** Phase 1: oil/fluid, tire, repair, etc. */
  serviceType?: ServiceType;
  /** Odometer when job was completed (mileage timeline) */
  odometerAtCompletion?: number;
  /** Link to OBD2 snapshot for this job */
  obd2SnapshotId?: string;
  /** Tire job: position (e.g. FL, FR, RL, RR) */
  tirePosition?: string;
  /** Tire job: spec or size */
  tireSpec?: string;
}

export type ServiceType =
  | 'oil-change'
  | 'fluid-change'
  | 'tire-replacement'
  | 'tire-rotation'
  | 'repair'
  | 'inspection'
  | 'other';

/** OBD2 snapshot: DTCs and optional freeze frame / live data */
export interface Obd2Snapshot {
  id: string;
  vehicleId: string;
  maintenanceJobId?: string;
  capturedAt: string;
  dtcs: Obd2Dtc[];
  freezeFrame?: Record<string, unknown>;
  liveData?: Record<string, unknown>;
  suggestedTasks?: Obd2SuggestedTask[];
}

export interface Obd2Dtc {
  code: string;
  description?: string;
  status?: 'confirmed' | 'pending';
}

export interface Obd2SuggestedTask {
  title: string;
  description?: string;
  priority?: JobPriority;
  component?: string;
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

/** DVIR / pre-trip inspection record (Phase 3). */
export interface InspectionItem {
  id: string;
  label: string;
  passed: boolean;
  critical?: boolean;
}

export interface InspectionRecord {
  id: string;
  vehicleId: string;
  inspectedAt: string;
  inspectorRole?: string;
  items: InspectionItem[];
  passed: boolean;
}

export interface DefectRecord {
  id: string;
  vehicleId: string;
  inspectionId: string;
  title: string;
  critical: boolean;
  maintenanceJobId?: string;
}

/** Unguessable driver tracking token for read-only status board. */
export interface DriverTrackingToken {
  token: string;
  vehicleId: string;
  driverName?: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'shop_manager' | 'technician' | 'driver';

export interface FleetArchive {
  vehicles: Vehicle[];
  jobs: MaintenanceJob[];
  archivedAt: string;
}
