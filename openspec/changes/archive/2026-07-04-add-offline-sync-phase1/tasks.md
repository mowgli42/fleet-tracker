## 1. OpenSpec foundation

- [x] 1.1 Run `openspec init` and configure Cursor skills
- [x] 1.2 Add `openspec/project.md` with fleet-tracker context
- [x] 1.3 Extend `AGENTS.md` with spec-driven workflow and verification gate

## 2. Spec artifacts

- [x] 2.1 Create change `add-offline-sync-phase1` with proposal and design
- [x] 2.2 Write Gherkin delta specs: `offline-sync`, `fleet-availability`
- [x] 2.3 Add `verification.md` scenario traceability matrix

## 3. Projection source selection

- [x] 3.1 Update `syncRuntime.refreshSyncSnapshot` to use local events when cloud offline
- [x] 3.2 Expose `projectionSource: 'local' | 'cloud'` on sync snapshot for `/sync` debug display

## 4. Outbox backoff

- [x] 4.1 Add `computeBackoffMs(attempt)` helper (1s → 60s cap)
- [x] 4.2 Track flush backoff state in `syncRuntime`; skip flush until elapsed
- [x] 4.3 Reset backoff after successful flush

## 5. Tests (Gherkin verification)

- [x] 5.1 Add parity test: same event stream → identical readiness counts (local vs cloud path)
- [x] 5.2 Add invalid `entity_type` rejection test
- [x] 5.3 Add backoff helper unit tests
- [x] 5.4 Run `openspec validate add-offline-sync-phase1 --strict`

## 6. Documentation

- [x] 6.1 Update README with OpenSpec workflow pointer
- [x] 6.2 Update `docs/PHASE1.md` to reference OpenSpec change as behavior contract
