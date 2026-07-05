## ADDED Requirements

### Requirement: Shared readiness derivation

Ready, At-risk, and Blocked counts SHALL be computed only through `readinessForFleet` (and its helpers) in `projectReadiness.ts`.

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

When cloud is offline, owner and site availability displays SHALL project from the local event log.

#### Scenario: Local log drives counts offline

- **GIVEN** cloud is marked offline
- **AND** a `maintenance_blocked` event exists only in the local log (not yet in cloud)
- **WHEN** the sync snapshot refreshes
- **THEN** blocked count SHALL reflect the local event
- **AND** pending outbox depth SHALL be greater than zero if flush has not completed

#### Scenario: Cloud projection when online

- **GIVEN** cloud is marked online
- **AND** cloud state contains accepted events
- **WHEN** the sync snapshot refreshes
- **THEN** readiness counts SHALL be derived from cloud accepted events

### Requirement: Local and cloud parity for identical streams

For the same ordered event stream, local projection and cloud projection SHALL produce identical per-vehicle readiness classes.

#### Scenario: Parity golden stream

- **GIVEN** a fixed ordered list of maintenance and PM events for N vehicles
- **WHEN** `readinessForFleet` is called with that list as cloud events
- **AND** `readinessForFleet` is called with the same list as local events
- **THEN** per-vehicle classes and aggregate counts SHALL match exactly

### Requirement: Owner UI binding

The owner availability strip SHALL surface readiness counts and pending sync state.

#### Scenario: Sync page owner bar

- **GIVEN** the user opens `/sync`
- **WHEN** the page loads
- **THEN** a stacked bar SHALL show Ready, At-risk, and Blocked counts
- **AND** outbox depth SHALL be visible

#### Scenario: Pending sync indicator

- **GIVEN** the outbox contains unsynced events
- **WHEN** the main app shell or sync page renders
- **THEN** a pending-sync indicator SHALL be visible

### Requirement: Maintenance actions emit sync events

Creating or completing maintenance jobs SHALL emit corresponding sync events.

#### Scenario: New open job emits blocked event

- **GIVEN** a user creates a new open maintenance job for a vehicle
- **WHEN** the job is saved
- **THEN** a `maintenance_blocked` event SHALL be appended to the local log

#### Scenario: Completed job emits cleared event

- **GIVEN** a user marks a maintenance job completed
- **WHEN** the job is saved
- **THEN** a `maintenance_cleared` event SHALL be appended to the local log
