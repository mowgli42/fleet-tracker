# Fleet Tracker — Capability Specifications

Living behavioral contracts for Fleet Tracker. Each capability has `spec.md` with **Purpose**, **SHALL** requirements, and **GIVEN/WHEN/THEN** scenarios suitable for Gherkin tests in `features/`.

## CMMS alignment

Specs are informed by fleet maintenance best practices:

- **Usage-based PM** — service triggers from odometer and calendar (`pm-scheduling`), not arbitrary dates alone
- **Issue-to-repair workflow** — defects and jobs flow through explicit status transitions (`maintenance-job`, `tablet-job-workflow`)
- **Centralized asset history** — per-vehicle audit trail (`vehicle-history`)
- **Parts linkage** — work orders gate on parts availability (`parts-inventory`)
- **Operational availability** — owner-ready / at-risk / blocked under outage (`fleet-availability`, `offline-sync`)
- **Inspections at intake** — shop-floor checklist before work (`tablet-shop-floor`); full DVIR deferred to `inspections-compliance` (Phase 3)

## Capability index

| Capability | Phase | Route / surface | Gherkin feature |
|------------|-------|-----------------|-----------------|
| [vehicle](vehicle/spec.md) | 1 | `/fleet` | `features/vehicle.feature` |
| [vehicle-lifecycle](vehicle-lifecycle/spec.md) | 1 | `/fleet` edit panel | `features/vehicle-lifecycle.feature` |
| [vehicle-history](vehicle-history/spec.md) | 1 | `/fleet/vehicle/[id]/history` | `features/vehicle-history.feature` |
| [maintenance-job](maintenance-job/spec.md) | 1 | `/maintenance` | `features/maintenance-job.feature` |
| [parts-inventory](parts-inventory/spec.md) | 1 | `/parts` | `features/parts-inventory.feature` |
| [pm-scheduling](pm-scheduling/spec.md) | 1–2 | domain + dashboard | `features/pm-scheduling.feature` |
| [obd2-diagnostics](obd2-diagnostics/spec.md) | 1 | maintenance + tablet intake | `features/obd2-diagnostics.feature` |
| [dashboard-analytics](dashboard-analytics/spec.md) | 1 | `/` | `features/dashboard-analytics.feature` |
| [offline-sync](offline-sync/spec.md) | 1 | `src/lib/sync/` | `features/offline-sync.feature` |
| [fleet-availability](fleet-availability/spec.md) | 1 | `/sync`, shell | (covered in offline-sync + availability) |
| [sync-operations-ui](sync-operations-ui/spec.md) | 1 | `/sync` | `features/sync-operations-ui.feature` |
| [tablet-shop-floor](tablet-shop-floor/spec.md) | 1 demo | `/tablet/intake` | `features/tablet-shop-floor.feature` |
| [tablet-job-workflow](tablet-job-workflow/spec.md) | 1 demo | `/tablet/job/[id]` | `features/tablet-job-workflow.feature` |
| [cloud-multi-site](cloud-multi-site/spec.md) | 1 demo | `/cloud` | `features/cloud-multi-site.feature` |
| [site-transfer](site-transfer/spec.md) | 2 | sync events | `features/site-transfer.feature` |

### Phase 3 (production — domain rules + Gherkin; full infra deferred)

| Capability | Route / surface | Gherkin feature |
|------------|-----------------|-----------------|
| [auth-access-control](auth-access-control/spec.md) | domain module | `features/auth-access-control.feature` |
| [data-lifecycle](data-lifecycle/spec.md) | domain module | `features/data-lifecycle.feature` |
| [driver-status-board](driver-status-board/spec.md) | `/track/[token]` | `features/driver-status-board.feature` |
| [inspections-compliance](inspections-compliance/spec.md) | domain + history | `features/inspections-compliance.feature` |

## Workflow

See `openspec/WORKFLOW.md`. **Specs first** → Beads issues → implement → Gherkin → archive changes.

Validate all living specs:

```bash
npx @fission-ai/openspec validate --specs --strict
```
