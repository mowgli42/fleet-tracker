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

export interface Vehicle {
  id: string;
  name: string;
  status: VehicleStatus;
  lastService?: string;
  nextService?: string;
  odometer?: number;
  driver?: string;
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
}

export interface PartOrder {
  id: string;
  partName: string;
  quantity: number;
  orderDate: string;
  expectedDelivery?: string;
  status: PartOrderStatus;
  maintenanceJobId?: string;
}
