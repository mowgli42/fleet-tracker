# Proposal: Vehicle Edit, Intake/Checkout/Release, and Maintenance View

This document proposes extensions to the fleet-tracker app to support **vehicle lifecycle actions** (intake, checkout, release), a **maintenance view** that tracks mileage, oil/fluid changes, tire replacement and repair history, **quick intake with OBD2** for generating tasks and troubleshooting, and **selectable cars and repairs** with expansion and detailed history reports.

---

## 1. Current schema (summary)

| Entity | Key fields | Gaps for proposal |
|--------|------------|-------------------|
| **Vehicle** | id, name, status, lastService, nextService, odometer, driver, role, odometerAtLastService | No intake/checkout/release events; no edit surface; no service log timeline |
| **MaintenanceJob** | vehicleId, title, component, planned, status, history, odometerAtJobOpen, completedAt, … | No `serviceType` (oil vs tire vs repair); no link to OBD2; no odometerAtCompletion |
| **PartOrder** | partName, quantity, maintenanceJobId, receivedAt, quantityUsed | Adequate for parts; could link part type to service (e.g. oil filter → oil-change) |

**Gaps (additional):** No VIN; no explicit validation rules; no persistence strategy for Phase 1.

**Existing strengths:** Vehicle status, job history, component, planned/unplanned, timestamps, and parts linkage already support repair history and basic maintenance tracking. The main additions are lifecycle events, service-type distinction, OBD2 capture, and UX for selection/expansion/reports.

---

## 2. Vehicle edit and intake / checkout / release

### 2.1 Lifecycle model

- **Intake:** Vehicle enters the lot for maintenance (driver drops off; vehicle goes from in-use/ready → maintenance or “in-lot”).
- **Checkout:** Vehicle is taken out for use (assigned driver, status → in-use).
- **Release:** Vehicle is released from maintenance back to the pool (status → ready) or directly to a driver (→ in-use).

Proposed **Vehicle** extensions:

- **`checkedOutAt`** (ISO date-time, optional): When the vehicle was last checked out for use.
- **`releasedAt`** (optional): When last released from maintenance.
- **`intakeAt`** (optional): When last brought in for maintenance (or current intake).
- **`currentJobId`** (optional): Active maintenance job if status is `maintenance`.

Optional **VehicleEvent** (or events array on vehicle) for full audit:

- `type: 'intake' | 'checkout' | 'release'`
- `at`: ISO date-time
- `by`: user or system
- `note`: optional
- `maintenanceJobId`: for intake, link to the job created or targeted.

Either extend **Vehicle** with the three timestamps + `currentJobId`, or add a small **VehicleEvent** table (e.g. `vehicleId`, `type`, `at`, `by`, `note`, `maintenanceJobId`) and derive “last” from the latest event per type.

### 2.2 Edit function (per car)

- **Edit** opens a form (or slide-over) for that vehicle:
  - Editable: name, odometer, driver, role, lastService, nextService, status.
  - Actions (buttons):
    - **Intake for maintenance** → set status to `maintenance`, set `intakeAt` (and optionally create/open a job, link `currentJobId`).
    - **Checkout** → set status to `in-use`, set driver, set `checkedOutAt`, clear `currentJobId` if present.
    - **Release** → set status to `ready` (or `in-use` if released to driver), set `releasedAt`, clear `currentJobId`.
- Validation: e.g. cannot release if open job still in progress; optional warning if odometer not updated at intake.
- **Edit scope:** Allow direct status edit for admin plus the three actions (intake, checkout, release) for workflow.

### 2.3 Validation rules

- **Release:** Allowed only when the vehicle has no open (non-completed) maintenance job. If the vehicle has an open job, block release and prompt to complete or reassign the job first.
- **Checkout:** When setting status to `in-use`, require a driver to be set (or show warning).
- **Intake:** Must set or link a maintenance job and set `vehicle.currentJobId`; set vehicle status to `maintenance` and `intakeAt`.
- **Optional:** Require odometer to be updated at intake (warning if missing or stale).

---

## 3. Maintenance view: mileage, oil/fluid, tires, repair history

### 3.1 Service types

Introduce a **service type** so the app can filter and show “oil/fluid”, “tires”, “repair” separately.

**MaintenanceJob** extension:

- **`serviceType`**: `'oil-change' | 'fluid-change' | 'tire-replacement' | 'tire-rotation' | 'repair' | 'inspection' | 'other'`.
- **`odometerAtCompletion`** (optional): Odometer when job was completed (for mileage-based schedules and reports).

**Vehicle** (already has lastService/nextService/odometer):

- Keep **odometer** as current; **odometerAtLastService** already exists; optional **nextOilChangeMiles** / **nextTireRotationMiles** if you want schedule-by-miles in addition to date.

### 3.2 Maintenance view content

- **Mileage:** Use existing `odometer`, `odometerAtLastService`, and per-job `odometerAtJobOpen` / `odometerAtCompletion` to show a simple timeline (e.g. “Odometer at service” over time). Optional: **ServiceLog** (see below) for a lightweight mileage history.
- **Oil/fluid changes:** Jobs with `serviceType === 'oil-change' | 'fluid-change'` and optional `component === 'engine'` (or similar). List by vehicle with date and odometer.
- **Tire replacement:** Jobs with `serviceType === 'tire-replacement' | 'tire-rotation'` and `component === 'tires'`. Optional: **tirePosition** (e.g. FL, FR, RL, RR) and **tireSpec** on the job or in notes.
- **Repair history:** Existing **MaintenanceJob** with `serviceType === 'repair'` (or “all except oil/fluid/tire/inspection”). Show by vehicle with component, date, and status.

One **maintenance view** can have:

- Tabs or filters: **By vehicle** | **By type** (oil, tires, repairs) | **Timeline**.
- Per vehicle: mileage trend, next due (from nextService / nextOilChangeMiles), and list of jobs (oil, tires, repairs) with expansion (see below).

### 3.3 Optional: ServiceLog (lightweight mileage/service timeline)

If you want a simple timeline without tying every entry to a full MaintenanceJob:

- **ServiceLog** (or `vehicle.serviceLog[]`):
  - `date`, `odometer`, `type`: `'oil-change' | 'tire-rotation' | 'tire-replacement' | 'inspection' | 'repair' | 'other'`, `note`, optional `maintenanceJobId` (link to full job).
- Use for quick “mileage at service” history and next-due calculations; full detail stays in MaintenanceJob.

---

## 4. Quick intake and OBD2-driven maintenance

### 4.1 Quick intake flow

- From **Fleet** or a global “Intake” action: user selects a vehicle and clicks **Intake for maintenance**.
- Optional: **Reason** (e.g. “Check engine light”, “Scheduled service”, “Driver report”).
- System: set vehicle status to `maintenance`, set `intakeAt`, optionally create a new **MaintenanceJob** (e.g. “Intake – [reason]”, status open) and set `vehicle.currentJobId`.
- If **OBD2 data** is provided (see below), attach it to that job and use it to suggest tasks and troubleshooting.

### 4.2 OBD2 data and schema

Goal: store a snapshot of OBD2 readout to generate maintenance tasks and assist troubleshooting.

**New entity: Obd2Snapshot** (or `Obd2Readout`)

- **id**
- **vehicleId**
- **maintenanceJobId** (optional; link to job created at intake or existing)
- **capturedAt**: ISO date-time
- **dtcs**: array of diagnostic trouble codes, e.g. `{ code: 'P0301', description: 'Cylinder 1 misfire', status: 'confirmed' | 'pending' }`
- **freezeFrame** (optional): key-value of PIDs at time of DTC (e.g. engine RPM, load, speed)
- **liveData** (optional): snapshot of live PIDs (e.g. oil temp, coolant temp, battery voltage)
- **suggestedTasks** (optional): array of `{ title, description, priority, component }` derived from DTCs (e.g. from a lookup table or future integration)

**MaintenanceJob** extension:

- **`obd2SnapshotId`** (optional): link to the Obd2Snapshot used at intake or during diagnosis.

**UI:**

- **Intake** form: field or “Upload / paste OBD2” to attach an Obd2Snapshot (manual entry of DTCs + optional freeze frame, or file upload if you support a standard format).
- When snapshot is present: show **DTCs** and **suggested tasks**; allow “Create job from suggestion” to turn a suggestion into a MaintenanceJob.
- **Troubleshooting:** Display DTC descriptions and freeze frame in the job’s detail/expansion view; link to repair history for same component.

### 4.3 Suggested tasks from OBD2

- Maintain a small **DTC → suggestion** reference (e.g. P0420 → “Check catalytic converter / O2 sensors”, P0171 → “Check MAF / vacuum leak”).
- When an Obd2Snapshot is saved, map each DTC to one or more suggested tasks and store in `suggestedTasks` or create draft jobs; user can accept or edit.

---

## 5. Selectable cars and repairs with expansion and history reports

### 5.1 Fleet: selectable cars

- **List/grid:** Each vehicle row (or card) is **selectable** (click or checkbox). Single or multi-select depending on needs.
- **Expansion:** On select, expand inline or open a **detail panel** (drawer/slide-over) showing:
  - Vehicle details (name, status, odometer, driver, role, last/next service).
  - **Current job** (if any): title, status, due date, link to full job.
  - **Recent service log:** Last N oil/fluid, tire, repair events (from MaintenanceJob + optional ServiceLog) with date and odometer.
  - **Repair history summary:** Count or short list by component; link to “Full history report” for this vehicle.
- **Edit:** “Edit” button in the detail panel opens the vehicle edit form (and intake/checkout/release actions).

### 5.2 Maintenance: selectable repairs (jobs)

- **List:** Each maintenance job row is **selectable**.
- **Expansion:** On select, expand inline or open a **detail panel** showing:
  - Job: title, description, priority, status, component, serviceType, planned/unplanned, due date, assignedTo, timestamps.
  - **History:** Full `history[]` (already in schema).
  - **Parts:** Parts required and parts orders linked to this job (from PartOrder by maintenanceJobId).
  - **OBD2:** If `obd2SnapshotId` is set, show DTCs, freeze frame, and suggested tasks.
  - **Vehicle:** Name, current odometer, link to vehicle detail.
  - **“Detailed history report”** for this vehicle: link to a read-only view of all jobs and service log for the same vehicle (see below).

### 5.3 Detailed history reports

- **Vehicle history report:** One vehicle selected → full-screen or modal with:
  - Vehicle header (name, id, current odometer, status).
  - Chronological list (or by type) of all MaintenanceJob and optional ServiceLog for that vehicle: date, odometer, serviceType, component, title, status. Expandable rows for full job detail and parts.
  - Optional: export or print.
- **Repair / job-centric view:** From a selected job, “View full vehicle history” opens the same vehicle history report with that job highlighted or scrolled into view.

---

## 6. Schema changes summary

| Area | Change |
|------|--------|
| **Vehicle** | Add `checkedOutAt?`, `releasedAt?`, `intakeAt?`, `currentJobId?`; optional `vin?` (optional in Phase 1, required for production/VIN scan); optional `serviceLog[]` or rely on jobs only. |
| **MaintenanceJob** | Add `serviceType`, `odometerAtCompletion?`, `obd2SnapshotId?`; optional `tirePosition?`, `tireSpec?` for tire jobs. |
| **New: Obd2Snapshot** | vehicleId, maintenanceJobId?, capturedAt, dtcs[], freezeFrame?, liveData?, suggestedTasks?. |
| **Optional: ServiceLog** | Per-vehicle list of { date, odometer, type, note, maintenanceJobId? } for lightweight timeline (Phase 2 if needed). |
| **Optional: VehicleEvent** | vehicleId, type (intake / checkout / release), at, by, note, maintenanceJobId for full audit (Phase 2). |

---

## 7. UI/UX summary

- **Fleet:** Edit per car; intake/checkout/release actions; selectable rows with expansion (vehicle details, current job, recent service, repair summary, link to full history report).
- **Maintenance:** Selectable job rows with expansion (job detail, history, parts, OBD2, vehicle); link to vehicle history report.
- **Intake:** Quick “Intake for maintenance” with optional reason and OBD2 capture; create job and optionally suggested tasks from DTCs.
- **Maintenance view:** Tabs/filters by vehicle, by type (oil, tires, repairs), timeline; mileage and service type surfaced from jobs (and optional ServiceLog).
- **History reports:** Vehicle-level report (all jobs + service log); accessible from vehicle expansion and from job expansion.

---

## 8. Implementation order (Phase 1 – see Section 9)

The suggested order below is Phase 1; Phase 2 order is in Section 10.

---

## 9. Phase 1 – JSON + SvelteKit

**Stack:** SvelteKit frontend only. Data: base JSON in `src/lib/data/` plus **localStorage** for user edits and new records (vehicles, jobs, parts, obd2-snapshots). No backend.

**Persistence:** Phase 1 edits persist in **localStorage** (e.g. single key `fleet-tracker-overrides` merging over base JSON at load, or a full in-browser copy). Data resets if the user clears site data. No server persistence.

**DTC reference:** A small **DTC → suggestion** reference, e.g. `src/lib/data/dtc-reference.json`, mapping code → `{ title, description, priority?, component? }`. Maintained as static data; used when saving an Obd2Snapshot to populate `suggestedTasks`.

**Deliverables (in order):**

1. **Schema and types** – Extend types: Vehicle (`intakeAt?`, `checkedOutAt?`, `releasedAt?`, `currentJobId?`, optional `vin?`); MaintenanceJob (`serviceType`, `odometerAtCompletion?`, `obd2SnapshotId?`, optional `tirePosition?`, `tireSpec?`); new Obd2Snapshot type. Add dtc-reference.json and extend existing JSON with `serviceType` and new fields where needed.
2. **Persistence layer** – Store/module that loads base JSON, applies localStorage overrides, exposes a single data interface, and provides save (write back to localStorage) for edits and new records.
3. **Vehicle edit + lifecycle** – Edit form per vehicle; Intake, Checkout, Release actions with validation (e.g. block release if open job).
4. **Fleet selectable + expansion** – Selectable vehicle rows; expansion with vehicle details, current job, recent services, repair summary, link to history report; Edit button.
5. **Maintenance view (by type)** – Tabs/filters: By vehicle | By type (oil/fluid, tires, repairs) | Timeline. Use `serviceType` and `odometerAtCompletion`; ServiceLog deferred to Phase 2.
6. **Maintenance selectable + expansion** – Selectable job rows; expansion with job detail, history, parts, OBD2 (if linked), vehicle link, "View full vehicle history."
7. **Vehicle history report** – Dedicated view/modal for one vehicle: all jobs chronological or by type; link from fleet and job expansion.
8. **OBD2 intake** – Intake flow with optional manual DTC entry; create Obd2Snapshot, link to job; DTC reference to suggest tasks; show DTCs and suggested tasks in job expansion.

---

## 10. Phase 2 – Python + FastAPI

**Stack:** FastAPI backend (Python 3.x), relational DB (e.g. PostgreSQL), SvelteKit frontend calling REST API. Auth and production concerns (security hardening, backup, archive, mobile VIN app, driver status board and unique URLs) are specified in the **production-readiness proposal** ([docs/PROPOSAL-PRODUCTION-READINESS.md](PROPOSAL-PRODUCTION-READINESS.md)).

**API surface:** REST resources for vehicles, maintenance_jobs, part_orders, obd2_snapshots; optional vehicle_events (append-only). List/get/create/update endpoints; pagination and filters (e.g. by serviceType, vehicleId, status). Auth (e.g. JWT or session); SvelteKit loads data via API instead of JSON/localStorage.

**Deliverables (in order):**

1. **API and DB schema** – FastAPI app; DB tables for vehicles, maintenance_jobs, part_orders, obd2_snapshots, vehicle_events; lookup tables (dtc_reference, components, technicians). REST list/get/create/update; pagination and filters.
2. **Auth** – Auth strategy per production proposal; protect write endpoints; optional roles (admin, mechanic, driver) for future driver-facing page.
3. **SvelteKit integration** – Replace JSON/localStorage with API calls; same UI; persist edits through API.
4. **Migration** – Script or process to load existing JSON (and exported localStorage) into DB.
5. **OBD2 and DTC** – DTC reference in DB or config; suggested-tasks logic from DTC codes; optional file upload for OBD2 export format.

**Out of scope in Phase 2 (covered in production-readiness proposal):** Security hardening, backup/restore, archive of legacy/sold vehicles, mobile VIN scan app, driver status board and unique URLs.
