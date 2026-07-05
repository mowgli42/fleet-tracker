# Vehicle Lifecycle

## Purpose

Manage **intake**, **checkout**, and **release** workflows that connect fleet assets to maintenance operations. CMMS best practice: every vehicle movement (in-lot, in-use, in-shop) SHALL be traceable and gated so vehicles are not released while work is incomplete — reducing safety risk and unplanned downtime.

## Requirements

### Requirement: Intake for maintenance

The system SHALL bring a vehicle into maintenance with a linked work context.

#### Scenario: Intake creates job and sets maintenance status

- **GIVEN** a vehicle with status `ready` or `in-use`
- **WHEN** a fleet manager triggers **Intake** from the vehicle edit panel
- **THEN** a new open maintenance job SHALL be created for the vehicle
- **AND** vehicle status SHALL become `maintenance`
- **AND** `intakeAt` SHALL be set
- **AND** `currentJobId` SHALL reference the new job

#### Scenario: Intake captures odometer when available

- **GIVEN** the vehicle edit form shows an odometer value
- **WHEN** intake completes
- **THEN** the new job SHALL record `odometerAtJobOpen` from the vehicle odometer

### Requirement: Checkout to driver

The system SHALL assign a vehicle to a driver for operational use.

#### Scenario: Checkout requires driver

- **GIVEN** an existing vehicle
- **WHEN** a fleet manager triggers **Checkout** without a driver name
- **THEN** checkout SHALL be blocked
- **AND** a clear validation message SHALL be shown

#### Scenario: Successful checkout

- **GIVEN** a vehicle with a driver name provided
- **WHEN** checkout completes
- **THEN** vehicle status SHALL be `in-use`
- **AND** `checkedOutAt` SHALL be set
- **AND** `currentJobId` SHALL be cleared if present

### Requirement: Release from maintenance

The system SHALL return a vehicle to the available pool only when maintenance is complete.

#### Scenario: Release blocked with open job

- **GIVEN** a vehicle has a non-completed maintenance job
- **WHEN** a fleet manager attempts **Release**
- **THEN** release SHALL be blocked
- **AND** the open job SHALL remain linked

#### Scenario: Successful release

- **GIVEN** a vehicle in `maintenance` with no open jobs
- **WHEN** release completes
- **THEN** vehicle status SHALL be `ready`
- **AND** `releasedAt` SHALL be set
- **AND** `currentJobId` SHALL be cleared

### Requirement: Status transition validation

Direct status edits SHALL enforce the same rules as lifecycle actions.

#### Scenario: In-use without driver rejected on save

- **GIVEN** the vehicle edit panel is open
- **WHEN** status is set to `in-use` without a driver and saved
- **THEN** save SHALL be rejected with a driver-required message

#### Scenario: Release to ready rejected with open job

- **GIVEN** an open maintenance job exists for the vehicle
- **WHEN** status is set to `ready` and saved
- **THEN** save SHALL be rejected when release rules apply
