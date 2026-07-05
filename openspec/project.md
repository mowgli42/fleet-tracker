# Fleet Tracker — Project Context

## Purpose

Fleet Tracker is a car fleet management web app (SvelteKit static site) for vehicle status, maintenance work orders, parts orders, offline-first sync, and shop-floor tablet demos. Data is JSON + `localStorage` in Phase 1.

## Tech Stack

- **SvelteKit 2** + **Svelte 5** + **TypeScript**
- **Tailwind CSS**
- **Vitest** — unit tests
- **Cucumber** — Gherkin verification (`features/`, `npm run test:gherkin`)
- **OpenSpec** — living specs in `openspec/specs/`
- **Beads** — task tracking (`.beads/`)

## CMMS domain alignment

Specs follow fleet maintenance best practices:

| Practice | Capabilities |
|----------|----------------|
| Asset registry | `vehicle`, `vehicle-lifecycle`, `vehicle-history` |
| Work orders | `maintenance-job`, `tablet-job-workflow` |
| PM programs | `pm-scheduling` |
| Parts / downtime | `parts-inventory` |
| Diagnostics | `obd2-diagnostics` |
| Uptime / KPIs | `dashboard-analytics`, `fleet-availability` |
| Distributed ops | `offline-sync`, `site-transfer`, `cloud-multi-site` |
| Compliance (future) | `inspections-compliance`, `auth-access-control` |

Full index: `openspec/specs/README.md`

## Conventions

- Domain types: `src/lib/types/fleet.ts`
- Vehicle rules: `src/lib/vehicle/vehicleRules.ts`
- Sync: `src/lib/sync/`
- Readiness: `projectReadiness.ts` only
- Spec → Beads → implement → Gherkin (see `openspec/WORKFLOW.md`)

## Phase map

- **Phase 1 (demo):** All specs except Phase 2/3 markers — implement via Beads in priority order
- **Phase 2:** `site-transfer`
- **Phase 3:** `auth-access-control`, `data-lifecycle`, `driver-status-board`, `inspections-compliance`
