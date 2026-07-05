# Change: Offline-first sync — Phase 1

## Why

Fleet Tracker must prove that a shop can keep maintenance operations running during cloud outages while giving owners trustworthy Ready / At-risk / Blocked availability once events sync. The sync pipeline exists in code but lacks a formal spec contract, Gherkin scenarios for verification, and parity between local projection (outage) and cloud projection (owner view).

## What Changes

- Introduce OpenSpec as the source of truth for Phase 1 offline-first sync behavior.
- Codify event envelope, outbox, cloud accept/reject, and readiness derivation as Gherkin requirements with a `verification.md` traceability matrix.
- Wire owner/site UI to a **single** `readinessForFleet` derivation: local event log when cloud is offline, cloud accepted events when online.
- Add parity and contract tests mapped to spec scenarios.
- Document exponential backoff for outbox flush (replacing fixed-interval-only retry).
- Explicitly defer Phase 2 transfer events and multi-site conflict harness.

## Capabilities

### New Capabilities

- `offline-sync`: Local append-only event log, durable outbox, site-key auth, cloud idempotent accept, ordering ladder, and flush/retry policy.
- `fleet-availability`: Shared Ready / At-risk / Blocked projection from events, local-vs-cloud source selection, and owner UI binding.

### Modified Capabilities

- _(none — first OpenSpec capabilities for this repo)_

## Impact

- **Code**: `src/lib/sync/*`, `src/lib/stores/syncRuntime.ts`, `/sync` route, `SyncStatusBar`, maintenance emit paths.
- **Tests**: `src/lib/sync/sync.test.ts` (expanded), optional integration against `scripts/demo-sync-server.ts`.
- **Docs**: `docs/OFFICE-HOURS-DESIGN-20260327.md`, `docs/TEST-PLAN-OFFLINE-SYNC.md` referenced by design; OpenSpec becomes canonical for Phase 1 behavior.
- **Out of scope**: `/cloud` multi-site rollup rewrite, `/tablet` native packaging, transfer lifecycle (Phase 2).
