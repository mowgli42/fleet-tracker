# Agent Workflow: OpenSpec + Gherkin + Beads

Follow this order unless the user explicitly requests a different approach.

## 1. Discovery & Specification (OpenSpec)

- Use `/opsx:explore` or `openspec` commands when adding or changing behavior.
- Create or update `openspec/specs/<capability>/spec.md` with:
  - Clear **Purpose**
  - Formal requirements using **SHALL** language
  - **GIVEN / WHEN / THEN / AND** scenarios (Gherkin-style)
- Write scenarios specific enough to become Gherkin tests in `features/`.
- Validate: `npx @fission-ai/openspec validate [change-id] --strict`

## 2. Task Breakdown & Tracking (Beads)

- After creating or updating a spec, create Beads issues from requirements/scenarios.
- Map every requirement or scenario to one or more Beads issues (`--spec-id openspec/specs/...`).
- Before implementation: `bd ready` — work the highest-priority ready item.
- Update status: `bd update <id> --status in_progress`, `bd close <id>` when done.
- Use `--parent`, `--deps blocks:` for ordering.

### Bead status labels (use in `--labels` and summaries)

| Status | Label | Meaning |
|--------|-------|---------|
| ⚪️ Backlog | `status:backlog` | Not yet broken down |
| 🔵 Specified | `status:specified` | OpenSpec spec with GWT scenarios |
| 🟠 Designed | `status:designed` | Technical approach defined |
| 🟡 Implementing | `status:implementing` | Code in progress |
| 🟢 Gherkin Verified | `status:gherkin-verified` | `features/*.feature` passing |
| ✅ Done | closed in Beads | Implemented, tests pass, ready to archive |

## 3. Implementation

- One Beads issue at a time (top `bd ready` item).
- Put domain rules in testable modules (e.g. `src/lib/vehicle/vehicleRules.ts`).
- Wire UI to domain modules; avoid duplicating validation in components.

## 4. Gherkin Verification

- Maintain `features/<capability>.feature` mirroring OpenSpec scenarios.
- Step definitions: `features/step_definitions/*.ts`
- Run: `npm run test:gherkin`
- Also run: `npm test` (Vitest unit tests)
- Failing Gherkin = spec or implementation bug — fix before closing Beads.

## 5. Validation & Archiving (OpenSpec)

- `openspec validate` before archive.
- When Gherkin + unit tests pass: `/opsx:archive` to merge change deltas into living specs.
- Close related Beads; leave archive task if needed.

## Commands

| Tool | Commands |
|------|----------|
| OpenSpec | `openspec validate`, `/opsx:explore`, `/opsx:propose`, `/opsx:apply`, `/opsx:archive` |
| Beads | `bd ready`, `bd list`, `bd show`, `bd create`, `bd close`, `bd update` |
| Tests | `npm test`, `npm run test:gherkin` |

## Living specs

| Capability | Spec |
|------------|------|
| Index + CMMS map | `openspec/specs/README.md` |
| Vehicle | `openspec/specs/vehicle/spec.md` |
| Vehicle lifecycle | `openspec/specs/vehicle-lifecycle/spec.md` |
| Maintenance jobs | `openspec/specs/maintenance-job/spec.md` |
| Parts | `openspec/specs/parts-inventory/spec.md` |
| PM | `openspec/specs/pm-scheduling/spec.md` |
| OBD2 | `openspec/specs/obd2-diagnostics/spec.md` |
| History | `openspec/specs/vehicle-history/spec.md` |
| Dashboard | `openspec/specs/dashboard-analytics/spec.md` |
| Offline sync | `openspec/specs/offline-sync/spec.md` |
| Availability | `openspec/specs/fleet-availability/spec.md` |
| Sync UI | `openspec/specs/sync-operations-ui/spec.md` |
| Tablet intake | `openspec/specs/tablet-shop-floor/spec.md` |
| Tablet jobs | `openspec/specs/tablet-job-workflow/spec.md` |
| Cloud demo | `openspec/specs/cloud-multi-site/spec.md` |
| Site transfer (P2) | `openspec/specs/site-transfer/spec.md` |
| Production (P3) | `auth-access-control`, `data-lifecycle`, `driver-status-board`, `inspections-compliance` |

## Communication rules

- Before implementation: run `bd ready` and state what you are working on.
- After completing a Beads issue: close it and report Gherkin/Vitest results.
- When proposing new work: spec first, then Beads, then code.
- Keep OpenSpec, `features/`, and Beads in sync when behavior changes.
