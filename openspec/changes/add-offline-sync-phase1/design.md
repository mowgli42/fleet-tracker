# Design: Offline-first sync — Phase 1

## Context

Fleet Tracker is a SvelteKit static app with JSON seed data and `localStorage` persistence. Phase 1 demo work (`docs/OFFICE-HOURS-DESIGN-20260327.md`) chose **local-first event log + cloud projection** (Approach B). Implementation lives under `src/lib/sync/` with optional HTTP cloud via `npm run demo:sync-server`.

Current state:

- Maintenance UI dual-writes `fleetDataStore` and emits sync events.
- Outbox flush runs on a 2.5s poll when cloud is "online".
- `readinessForFleet` projects cloud events only — local log is ignored during simulated outage.
- Unit tests cover validation, ordering, idempotency, and basic projection; most of `docs/TEST-PLAN-OFFLINE-SYNC.md` is unchecked.

## Goals / Non-Goals

**Goals:**

- One derivation module (`projectReadiness.ts`) is the only source for Ready / At-risk / Blocked.
- During cloud outage, site/owner strip uses **local event log** projection.
- When cloud is online, owner views use **cloud accepted events**.
- Gherkin specs + `verification.md` map every requirement to a test or UI check.
- Outbox flush uses exponential backoff on transient errors (1s → 60s cap).

**Non-Goals:**

- Cross-site transfer (`transfer_*` events).
- Two-site conflict harness.
- Docker local node packaging.
- Rewriting `/cloud` or `/tablet` prototypes to full sync surfaces.
- Production auth beyond per-site demo key.

## Decisions

### D1: Interim dual-write, event-sourced availability only

**Decision:** Keep `fleetDataStore` as the UX editing surface; sync events drive **availability projection only** for Phase 1.

**Rationale:** Matches shipped code with minimal churn. Full event-sourced read model is Phase 2+.

**Alternatives:** Event-only writes (rejected — too invasive for demo deadline).

### D2: Projection source selection

| Cloud state | Readiness source |
|-------------|------------------|
| Offline     | `loadLocalEvents()` |
| Online      | `loadCloudState().events` (accepted) |

Pending outbox depth is surfaced separately; events are already in the local log before flush.

### D3: Ordering ladder

Follow `docs/SYNC-ORDERING-LADDER.md`: primary `event_ts_server`, then `causal_version` per entity, then `event_ts_local`, then `event_id`.

### D4: Backoff in sync runtime

Replace naive fixed poll with: base interval 2.5s when healthy; on flush error, skip flushes until `nextRetryAt` computed by exponential backoff (1s, 2s, 4s … max 60s). Successful flush resets backoff.

### D5: Verification artifact

Add `verification.md` beside standard OpenSpec artifacts. Each Gherkin scenario lists: spec ref, test file/test name or manual UI step, and pass criteria. Agents run verification before archive.

## Risks / Trade-offs

- **[Risk] Local vs cloud counts diverge during partial sync** → Mitigation: parity golden test; pending badge when outbox > 0.
- **[Risk] Dual-write drift between store and events** → Mitigation: maintenance emit paths are the only writers; document in spec.
- **[Risk] Fixed poll masked retry policy** → Mitigation: backoff task in this change.

## Migration Plan

1. Land OpenSpec artifacts and `verification.md`.
2. Implement projection source switch + backoff.
3. Expand unit tests; run `npm test`.
4. Manual demo: toggle cloud offline on `/sync`, create job, confirm local readiness updates.

## Open Questions

1. Should `/cloud` show a "not Phase 1 owner view" banner? **Deferred** — document in README only.
2. PM at-risk from `nextService` when no `pm_risk_set` event — **keep** existing merge behavior in `readinessForFleet`.
