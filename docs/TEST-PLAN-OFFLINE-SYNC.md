# Test Plan: Offline Sync and Multi-Site Availability

This checklist converts the runtime-risk review into an execution-ready test plan for the approved offline-first demo in `docs/OFFICE-HOURS-DESIGN-20260327.md`.

## Scope

- **In scope:** Event schema, sync replay, conflict handling, outage recovery, transfer lifecycle, owner availability truth.
- **Out of scope:** Full RBAC hardening, multi-region failover, billing flows, rich native tablet packaging.

## Test Levels

- **Unit:** Event validation, projection functions, status derivation rules.
- **Integration:** Site outbox + cloud sync API + projector interaction.
- **E2E/Chaos:** Cloud outage, reconnect, and cross-site transfer convergence.

## Acceptance Gates

- No silent data loss for accepted local events.
- No duplicate owner-visible state transitions after replay.
- Status parity between local and cloud projection for the same event stream.
- Convergence after reconnect meets demo target.

## Checklist

### 1) Schema and Contract

- [ ] Event envelope rejects missing required fields (`event_id`, `site_id`, `entity_id`, `event_type`, `idempotency_key`, `causal_version`).
- [ ] Event envelope rejects invalid enum values for `entity_type` and `event_type`.
- [ ] Sync API returns explicit reject reasons for malformed or unauthorized events.
- [ ] Backward-compat contract check for optional payload fields.

### 2) Replay and Idempotency

- [ ] Duplicate submit of same `idempotency_key` results in one effective state transition.
- [ ] Duplicate projector apply of same `event_id` is a no-op.
- [ ] Replay after client retry storm does not create phantom ready/blocked transitions.
- [ ] Out-of-order delivery does not regress effective state unexpectedly.

### 3) Conflict Handling

- [ ] Concurrent edits to same vehicle from two sites resolve deterministically per policy.
- [ ] Tie-break behavior is deterministic and logged when conflicts occur.
- [ ] Conflict events are visible in logs/metrics, never silent.
- [ ] Policy test for `event_ts_server` vs `causal_version` precedence is explicit and stable.

### 4) Outage and Recovery

- [ ] Site can create/update maintenance events while cloud is unreachable for >= 30 minutes.
- [ ] Outbox persists through app restart during outage.
- [ ] Reconnect drains backlog and converges without manual repair.
- [ ] Backoff and retry behavior follows policy (bounded, no hot-loop).

### 5) Transfer Lifecycle

- [ ] Transfer to offline destination enters `in-transit` and remains visible.
- [ ] Destination reconnect auto-applies transfer exactly once.
- [ ] Duplicate transfer submission does not duplicate vehicle movement.
- [ ] Stale in-transit timeout triggers escalation path (or explicit blocked state).

### 6) Status Derivation and Owner Trust

- [ ] Ready/At-risk/Blocked derivation matches specification for representative event streams.
- [ ] Local and cloud derive identical status for identical ordered streams.
- [ ] Owner dashboard does not show contradictory status across views.
- [ ] Pending-sync indicator appears when local state is ahead of cloud.

### 7) Performance and Scale (Demo Targets)

- [ ] Reconnect convergence benchmark for <= 5,000 queued events is within target.
- [ ] Sync batching behavior prevents oversized payload failures.
- [ ] Projection lag is observable and within acceptable demo bounds.

### 8) Observability and Debuggability

- [ ] Structured logs include `site_id`, `entity_id`, `event_id`, and sync outcome.
- [ ] Metrics emitted for: queued events, replay success/fail, conflicts, projection lag.
- [ ] Alert condition exists for prolonged projection lag or stuck outbox.
- [ ] Operator can trace a single vehicle state transition end-to-end from logs.

## CI Matrix (Minimum)

- **Unit suite:** schema, projection, derivation.
- **Integration suite:** sync API + outbox + projector.
- **Outage suite:** network down/reconnect replay.
- **Transfer suite:** offline destination + auto-apply.

## Exit Criteria (Go/No-Go for Demo)

- [ ] All critical checklist items pass.
- [ ] No open silent-failure gaps.
- [ ] One scripted outage demo run succeeds end-to-end on a clean environment.
- [ ] One scripted outage demo run succeeds on a dirty/retry-heavy environment.
