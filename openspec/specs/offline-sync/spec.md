# Offline Sync

## Purpose

Provide local-first event capture and cloud replay so maintenance operations continue during connectivity outages. Aligns with CMMS practice of **never losing accepted work-in-progress** and maintaining an **audit-ready event trail** per site. Phase 1 uses browser `localStorage` and optional HTTP demo server (`scripts/demo-sync-server.ts`).

## Requirements

### Requirement: Event envelope validation

The sync pipeline SHALL reject events that do not conform to the Phase 1 envelope before appending to the local log or outbox.

#### Scenario: Valid maintenance event accepted

- **GIVEN** an event with `event_id`, `site_id`, `entity_type`, `entity_id`, `event_type`, `event_ts_local`, `actor_id`, `idempotency_key`, `causal_version`, and `payload`
- **WHEN** `validateEventEnvelope` is called
- **THEN** validation SHALL succeed
- **AND** the event MAY be appended to the local log and outbox

#### Scenario: Missing event_id rejected

- **GIVEN** an otherwise valid envelope with an empty `event_id`
- **WHEN** validation runs
- **THEN** validation SHALL fail with a non-empty reason

#### Scenario: Invalid entity_type rejected

- **GIVEN** an envelope whose `entity_type` is not one of `vehicle`, `maintenance_job`, or `transfer`
- **WHEN** validation runs
- **THEN** validation SHALL fail

### Requirement: Durable local event log

The site app SHALL append accepted events to a durable local event log in `localStorage` before queueing for cloud sync.

#### Scenario: Event survives append

- **GIVEN** a valid event envelope
- **WHEN** `appendAndQueueEvent` is called
- **THEN** the event SHALL appear in `loadLocalEvents()`
- **AND** the event SHALL appear in the outbox

#### Scenario: Invalid event not appended

- **GIVEN** an invalid envelope
- **WHEN** `appendAndQueueEvent` is called
- **THEN** the call SHALL throw
- **AND** neither local log nor outbox SHALL be modified

### Requirement: Cloud accept with idempotency

The cloud accept path SHALL deduplicate by `idempotency_key` and assign `event_ts_server` on first accept.

#### Scenario: First accept succeeds

- **GIVEN** a valid event and correct site key
- **WHEN** `acceptEventOnCloud` processes the event
- **THEN** the result status SHALL be `accepted`
- **AND** `event_ts_server` SHALL be set on the stored event

#### Scenario: Duplicate idempotency key is no-op

- **GIVEN** an event already accepted with `idempotency_key` K
- **WHEN** the same event (or same K) is submitted again
- **THEN** the cloud state SHALL contain exactly one effective transition for K
- **AND** no duplicate event SHALL be stored

#### Scenario: Wrong site key rejected

- **GIVEN** a valid event and an incorrect site key
- **WHEN** `acceptEventOnCloud` processes the event
- **THEN** the result status SHALL be `rejected`
- **AND** the reject reason SHALL include an auth-related code

### Requirement: Outbox flush when cloud online

The outbox worker SHALL flush queued events to cloud when cloud is marked online.

#### Scenario: Flush drains outbox on success

- **GIVEN** one or more events in the outbox and cloud is online
- **WHEN** `flushOutboxToCloud` runs successfully
- **THEN** the outbox depth SHALL decrease by the number of accepted events
- **AND** cloud state SHALL include those events

#### Scenario: Flush skipped when cloud offline

- **GIVEN** events in the outbox and cloud is marked offline
- **WHEN** `flushOutboxToCloud` runs
- **THEN** no events SHALL be removed from the outbox
- **AND** local events SHALL remain in the log

### Requirement: Exponential backoff on flush failure

The sync runtime SHALL apply exponential backoff after a flush error before retrying (1s → 60s cap).

#### Scenario: Backoff after error

- **GIVEN** a flush attempt returns `lastError`
- **WHEN** the next poll tick occurs before backoff elapses
- **THEN** flush SHALL NOT be attempted
- **WHEN** backoff elapses
- **THEN** flush SHALL be attempted again

#### Scenario: Backoff resets on success

- **GIVEN** a prior flush error increased backoff
- **WHEN** a subsequent flush succeeds with no error
- **THEN** backoff SHALL reset to the base interval

### Requirement: Deterministic replay ordering

Events SHALL be replayed in a deterministic total order per `docs/SYNC-ORDERING-LADDER.md`.

#### Scenario: Server time ordering

- **GIVEN** two events with different `event_ts_server` values
- **WHEN** `sortEventsForReplay` runs
- **THEN** the earlier server timestamp SHALL sort first

#### Scenario: Causal version tie-break

- **GIVEN** two events for the same entity with equal `event_ts_server`
- **WHEN** `sortEventsForReplay` runs
- **THEN** the lower `causal_version` SHALL sort first
