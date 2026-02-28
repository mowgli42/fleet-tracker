# Phase 1 Plan: SvelteKit + JSON + localStorage

**Stack:** SvelteKit frontend only. Data: base JSON in `src/lib/data/` plus **localStorage** for user edits and new records (vehicles, jobs, parts, obd2-snapshots). No backend.

**Persistence:** Edits persist in **localStorage** (e.g. key `fleet-tracker-overrides` merging over base JSON at load). Data resets if the user clears site data.

**DTC reference:** `src/lib/data/dtc-reference.json` mapping DTC code → `{ title, description, priority?, component? }`.

---

## Deliverables (implementation order)

| # | Deliverable | Description |
|---|-------------|-------------|
| 1 | **Schema and types** | Extend Vehicle (intakeAt?, checkedOutAt?, releasedAt?, currentJobId?, vin?); MaintenanceJob (serviceType, odometerAtCompletion?, obd2SnapshotId?, tirePosition?, tireSpec?); new Obd2Snapshot type; dtc-reference.json; extend base JSON. |
| 2 | **Persistence layer** | Store/module: load base JSON, apply localStorage overrides, single data interface, save() to localStorage. |
| 3 | **Vehicle edit + lifecycle** | Edit form per vehicle; Intake, Checkout, Release with validation (block release if open job). |
| 4 | **Fleet selectable + expansion** | Selectable vehicle rows; expansion with details, current job, recent services, repair summary, link to history report; Edit button. |
| 5 | **Maintenance view (by type)** | Tabs/filters: By vehicle \| By type (oil/fluid, tires, repairs) \| Timeline. |
| 6 | **Maintenance selectable + expansion** | Selectable job rows; expansion with job detail, history, parts, OBD2 (if linked), vehicle link, "View full vehicle history." |
| 7 | **Vehicle history report** | Dedicated view/modal for one vehicle: all jobs chronological or by type; link from fleet and job expansion. |
| 8 | **OBD2 intake** | Intake flow: optional manual DTC entry; create Obd2Snapshot, link to job; DTC reference for suggested tasks; show in job expansion. |

---

## Validation rules (Phase 1)

- **Release:** Only when vehicle has no open (non-completed) job.
- **Checkout:** Require driver when setting status to in-use.
- **Intake:** Create or link job and set `vehicle.currentJobId`; set status to maintenance and `intakeAt`.

---

## File changes (summary)

- `src/lib/types/fleet.ts` – extended types
- `src/lib/data/dtc-reference.json` – new
- `src/lib/data/vehicles.json` – add new fields where needed
- `src/lib/data/maintenance-jobs.json` – add serviceType, odometerAtCompletion, etc.
- `src/lib/stores/fleetData.ts` (or similar) – persistence layer
- Routes: load from store instead of static JSON; add vehicle edit UI, fleet expansion, maintenance expansion, history report, OBD2 intake.
