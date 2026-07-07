# Fleet Availability

## Purpose

Derive owner-trustworthy **Ready**, **At-risk**, and **Blocked** availability from maintenance events and PM schedules. CMMS fleets track **asset uptime** and **PM compliance** as primary KPIs; this capability defines how Fleet Tracker projects operational readiness for shop and owner views, including during cloud outage (see `offline-sync`).

### Definitions

- **Ready** — No active maintenance blocker and PM not in the at-risk window.
- **At-risk** — PM due within threshold (demo: 7 days or 300 miles of `nextService`).
- **Blocked** — Active open maintenance job (blocking severity) or unresolved transfer beyond SLA (Phase 2).

## Requirements

### Requirement: Shared readiness derivation

Ready, At-risk, and Blocked counts SHALL be computed only through `readinessForFleet` in `projectReadiness.ts`.

#### Scenario: Blocked overrides at-risk

- **GIVEN** a vehicle with both `maintenance_blocked` and PM at-risk signals in the event stream
- **WHEN** readiness is computed
- **THEN** the vehicle class SHALL be `blocked`

#### Scenario: At-risk from PM window

- **GIVEN** a vehicle with `nextService` within the demo PM window and no blocking maintenance event
- **WHEN** readiness is computed
- **THEN** the vehicle class SHALL be `at-risk`

#### Scenario: Default ready

- **GIVEN** a vehicle with no blocking events and PM not in the at-risk window
- **WHEN** readiness is computed
- **THEN** the vehicle class SHALL be `ready`

### Requirement: Local projection during cloud outage

When cloud is offline, availability displays SHALL project from the local event log.

#### Scenario: Local log drives counts offline

- **GIVEN** cloud is marked offline
- **AND** a `maintenance_blocked` event exists only in the local log
- **WHEN** the sync snapshot refreshes
- **THEN** blocked count SHALL reflect the local event
- **AND** pending outbox depth SHALL be greater than zero if flush has not completed

#### Scenario: Cloud projection when online

- **GIVEN** cloud is marked online
- **AND** cloud state contains accepted events
- **WHEN** the sync snapshot refreshes
- **THEN** readiness counts SHALL be derived from cloud accepted events

### Requirement: Local and cloud parity

For the same ordered event stream, local and cloud projection SHALL produce identical per-vehicle readiness classes.

#### Scenario: Parity golden stream

- **GIVEN** a fixed ordered list of maintenance and PM events for N vehicles
- **WHEN** `readinessForFleet` is called with that list as local events
- **AND** `readinessForFleet` is called with the same list as cloud events
- **THEN** per-vehicle classes and aggregate counts SHALL match exactly

### Requirement: Maintenance actions emit availability events

Creating or completing maintenance jobs SHALL emit sync events that drive availability.

#### Scenario: New open job emits blocked event

- **GIVEN** a user creates a new open maintenance job for a vehicle
- **WHEN** the job is saved
- **THEN** a `maintenance_blocked` event SHALL be appended to the local log

#### Scenario: Completed job emits cleared event

- **GIVEN** a user marks a maintenance job completed
- **WHEN** the job is saved
- **THEN** a `maintenance_cleared` event SHALL be appended to the local log

### Requirement: Owner UI binding

The owner availability strip SHALL surface readiness counts and pending sync state on `/sync` and the main shell.

#### Scenario: Sync page owner bar

- **GIVEN** the user opens `/sync`
- **WHEN** the page loads
- **THEN** a stacked bar SHALL show Ready, At-risk, and Blocked counts
- **AND** outbox depth SHALL be visible

#### Scenario: Pending sync indicator

- **GIVEN** the outbox contains unsynced events
- **WHEN** the main app shell or sync page renders
- **THEN** a pending-sync indicator SHALL be visible
