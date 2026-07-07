# Maintenance Job (Work Order)

## Purpose

Manage **work orders** from creation through completion — the core CMMS workflow. Supports planned (PM) and unplanned (breakdown) jobs, priority, service type, component tracking, history notes, and linkage to parts and diagnostics. Every status change SHALL be auditable via job `history[]` and sync events when availability-impacting.

## Requirements

### Requirement: Work order creation

The system SHALL allow creating maintenance jobs with required vehicle linkage.

#### Scenario: Create job with required fields

- **GIVEN** the maintenance page is open
- **WHEN** a user submits a new job with vehicle, title, priority, and service type
- **THEN** the job SHALL be created with status `open`
- **AND** `createdAt` and `updatedAt` SHALL be set
- **AND** a `maintenance_blocked` sync event SHALL be emitted for availability

#### Scenario: Reject job without vehicle

- **GIVEN** the new job form is open
- **WHEN** the user saves without selecting a vehicle
- **THEN** creation SHALL be rejected with a clear message

### Requirement: Work order status machine

Jobs SHALL progress through: `open` → `in-progress` → `waiting-parts` → `completed` (any order except completed is terminal for open work).

#### Scenario: Transition to in-progress

- **GIVEN** a job with status `open`
- **WHEN** status is changed to `in-progress` and saved
- **THEN** status SHALL persist
- **AND** `updatedAt` SHALL advance

#### Scenario: Waiting for parts

- **GIVEN** linked parts orders are not all received
- **WHEN** status is set to `waiting-parts`
- **THEN** the job SHALL remain non-completed
- **AND** vehicle availability SHALL remain blocked while job is open

#### Scenario: Complete job

- **GIVEN** a job with status other than `completed`
- **WHEN** status is set to `completed` and saved
- **THEN** `completedAt` SHALL be set
- **AND** a `maintenance_cleared` sync event SHALL be emitted
- **AND** vehicle MAY be released per `vehicle-lifecycle`

### Requirement: Job history audit trail

The system SHALL append history entries documenting work performed.

#### Scenario: Add history note

- **GIVEN** a job edit panel is open
- **WHEN** the user adds a history entry with date and note
- **THEN** the entry SHALL appear in `job.history` ordered by date
- **AND** optional status snapshot MAY be stored on the entry

### Requirement: Service type and component classification

Jobs SHALL be classifiable for PM analytics and repair trends (CMMS: categorize work for MTBF/MTTR by component).

#### Scenario: Filter jobs by service type

- **GIVEN** jobs exist with types `oil-change`, `repair`, `tire-replacement`
- **WHEN** the user selects view **By type** on `/maintenance`
- **THEN** jobs SHALL be grouped or filtered by `serviceType`

#### Scenario: Component captured on repair

- **GIVEN** a repair job is edited
- **WHEN** component (e.g. `brakes`, `engine`) is set
- **THEN** the value SHALL persist for dashboard repair-trend aggregation

### Requirement: Planned vs unplanned classification

Jobs SHALL distinguish scheduled PM from breakdown work for unplanned % KPIs.

#### Scenario: Mark job as planned PM

- **GIVEN** a job is created from a PM schedule or marked planned
- **WHEN** `planned` is true
- **THEN** dashboard unplanned % SHALL exclude this job from unplanned numerator when completed

### Requirement: Job removal

Jobs SHALL be removable only with explicit confirmation.

#### Scenario: Slide to remove in edit panel

- **GIVEN** the job edit panel is open
- **WHEN** the user completes slide-to-remove
- **THEN** the job SHALL be deleted from the store
- **AND** sync events SHALL reflect cleared maintenance if this was the only open job for the vehicle

### Requirement: Maintenance views

The maintenance page SHALL support multiple lenses on the same work-order data.

#### Scenario: View by vehicle

- **GIVEN** jobs exist for multiple vehicles
- **WHEN** the user selects **By vehicle** view
- **THEN** jobs SHALL be grouped under vehicle name/id

#### Scenario: Timeline view

- **GIVEN** jobs have `createdAt` and `dueDate`
- **WHEN** the user selects **Timeline** view
- **THEN** jobs SHALL be ordered chronologically

#### Scenario: Expand row for detail

- **GIVEN** a job row is collapsed
- **WHEN** the user expands it
- **THEN** history, linked parts, and OBD2 snapshot summary SHALL be visible
