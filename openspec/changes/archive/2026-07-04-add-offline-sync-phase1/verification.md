# Verification: add-offline-sync-phase1

Post-implementation checklist mapping Gherkin scenarios to evidence. Run before `/opsx:archive`.

## Spec alignment

| Capability | Delta spec | Baseline after archive |
|------------|------------|------------------------|
| offline-sync | `openspec/changes/add-offline-sync-phase1/specs/offline-sync/spec.md` | `openspec/specs/offline-sync/spec.md` |
| fleet-availability | `openspec/changes/add-offline-sync-phase1/specs/fleet-availability/spec.md` | `openspec/specs/fleet-availability/spec.md` |

## Hallucination guards

**MUST exist after apply:**

- `src/lib/sync/projectReadiness.ts` — `readinessForFleet`, `foldVehicleFlagsFromEvents`
- `src/lib/sync/localEventLog.ts` — `loadLocalEvents`, `appendLocalEvent`
- `src/lib/sync/syncPipeline.ts` — `appendAndQueueEvent`, `flushOutboxToCloud`
- `src/lib/stores/syncRuntime.ts` — projection source switch + backoff state

**MUST NOT be introduced:**

- New npm backend framework or database for Phase 1
- Direct HTTP calls from UI components bypassing `cloudRemote` / `syncPipeline`
- Duplicate readiness logic outside `projectReadiness.ts`

## Pattern references

- Event types: `src/lib/sync/eventTypes.ts`
- Ordering: `docs/SYNC-ORDERING-LADDER.md`
- Demo server: `scripts/demo-sync-server.ts`
- Design authority: `docs/OFFICE-HOURS-DESIGN-20260327.md` (Phase 1 section)

## Scenario traceability

### offline-sync

| Scenario | Evidence |
|----------|----------|
| Valid maintenance event accepted | `sync.test.ts` → `validateEventEnvelope` accepts minimal |
| Missing event_id rejected | `sync.test.ts` → rejects empty event_id |
| Invalid entity_type rejected | `sync.test.ts` → rejects bad entity_type (if covered) |
| Event survives append | `sync.test.ts` or integration: append + loadLocalEvents |
| Invalid event not appended | unit: appendAndQueueEvent throws |
| First accept succeeds | `sync.test.ts` → acceptEventOnCloud |
| Duplicate idempotency key is no-op | `sync.test.ts` → idempotency |
| Wrong site key rejected | `sync.test.ts` → site key reject |
| Flush drains outbox on success | manual `/sync` or integration test |
| Flush skipped when cloud offline | `syncRuntime` unit or manual toggle |
| Backoff after error | `sync.test.ts` → backoff helpers |
| Backoff resets on success | `sync.test.ts` → backoff reset |
| Server time ordering | `sync.test.ts` → sortEventsForReplay |
| Causal version tie-break | `sync.test.ts` → causal_version ladder |

### fleet-availability

| Scenario | Evidence |
|----------|----------|
| Blocked overrides at-risk | `sync.test.ts` → projection blocked > at-risk |
| At-risk from PM window | `sync.test.ts` → PM window merge |
| Default ready | `sync.test.ts` → ready baseline |
| Local log drives counts offline | `syncRuntime` uses `loadLocalEvents` when offline; manual `/sync` |
| Cloud projection when online | `syncRuntime` uses cloud events when online |
| Parity golden stream | `sync.test.ts` → `readiness parity` |
| Sync page owner bar | manual `/sync` stacked bar |
| Pending sync indicator | `SyncStatusBar` / sync page outbox count |
| New open job emits blocked event | maintenance panel code path + manual |
| Completed job emits cleared event | maintenance complete path + manual |

## Verification steps (agent)

1. `openspec validate add-offline-sync-phase1 --strict`
2. `npm test` — all unit tests pass
3. For each row above marked manual, spot-check or note N/A with reason
4. Flag any scenario with no test and no manual pass as **DRIFT**
5. Confirm no duplicate readiness logic: `rg readinessForFleet src` only in `projectReadiness` + consumers

## Sign-off

- [x] All scenarios have evidence or documented waiver
- [x] `tasks.md` fully checked
- [x] No DRIFT items remain
