# OBD2 Diagnostics

## Purpose

Capture **on-board diagnostics** at intake or during jobs to accelerate **issue-to-repair** workflow — CMMS fleets use telematics/OBD data to convert fault codes into work orders. Phase 1 supports manual DTC entry, reference lookup, and linking snapshots to jobs.

## Requirements

### Requirement: OBD2 snapshot capture

The system SHALL store diagnostic snapshots per vehicle.

#### Scenario: Create snapshot with DTCs

- **GIVEN** a vehicle is selected for intake or job edit
- **WHEN** the user enters one or more DTC codes and saves
- **THEN** an `Obd2Snapshot` SHALL be created with `capturedAt` and `dtcs[]`
- **AND** it SHALL link to `vehicleId`

#### Scenario: Link snapshot to job

- **GIVEN** a maintenance job is open
- **WHEN** a snapshot is captured or selected
- **THEN** `maintenanceJob.obd2SnapshotId` SHALL reference the snapshot
- **AND** the job expansion SHALL show diagnostic summary

### Requirement: DTC reference lookup

The system SHALL map known DTC codes to human-readable titles and suggested priority.

#### Scenario: Known DTC enriches display

- **GIVEN** `dtc-reference.json` contains code `P0300`
- **WHEN** that code is entered
- **THEN** the UI SHALL show title and description from reference
- **AND** suggested priority MAY pre-fill job priority

#### Scenario: Unknown DTC still stored

- **GIVEN** a DTC not in reference
- **WHEN** the user saves the snapshot
- **THEN** the code SHALL still be stored with optional manual description

### Requirement: Suggested tasks from diagnostics

The system SHALL support suggested maintenance tasks derived from DTCs on snapshots.

#### Scenario: Suggested task list

- **GIVEN** DTCs map to suggested tasks in reference data
- **WHEN** the snapshot is saved
- **THEN** `suggestedTasks[]` MAY be populated
- **AND** the user MAY create a job from a suggestion

### Requirement: Display in maintenance context

OBD2 data SHALL be visible where technicians troubleshoot.

#### Scenario: Job expansion shows DTCs

- **GIVEN** a job has `obd2SnapshotId`
- **WHEN** the job row is expanded on `/maintenance`
- **THEN** DTC codes and descriptions SHALL be listed

#### Scenario: Tablet intake optional OBD step

- **GIVEN** tablet intake flow is active
- **WHEN** the user reaches the diagnostic step
- **THEN** they MAY enter DTCs before creating the intake job
