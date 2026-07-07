# Vehicle Management

## Purpose

Manage the complete lifecycle of fleet vehicles as the core assets of Fleet Tracker. This includes registration, operational status tracking, metadata, and ensuring only valid vehicles can be assigned to drivers or maintenance jobs. Data persists in `localStorage` via `fleetDataStore` (Phase 1 mockup; production auth and audit are future capabilities).

## Requirements

### Requirement: Vehicle Registration

The system SHALL allow fleet managers to register new vehicles with identifying information.

#### Scenario: Register a new vehicle successfully

- **GIVEN** the fleet registry is open on `/fleet`
- **WHEN** a fleet manager submits valid vehicle details (name required; optional id, VIN, role, odometer, status defaulting to `ready`)
- **THEN** the vehicle SHALL be created with the chosen status (default `ready`)
- **AND** it SHALL appear in the vehicle registry immediately
- **AND** the record SHALL persist in `localStorage` on save

#### Scenario: Prevent duplicate vehicle registration by id

- **GIVEN** a vehicle with id `v1` already exists
- **WHEN** a user attempts to register another vehicle with id `v1`
- **THEN** registration SHALL be rejected
- **AND** a clear error message SHALL be shown

#### Scenario: Prevent duplicate vehicle registration by VIN

- **GIVEN** a vehicle with VIN `1HGBH41JXMN109186` already exists
- **WHEN** a user attempts to register a vehicle with the same VIN (case-insensitive, trimmed)
- **THEN** registration SHALL be rejected
- **AND** a clear error message SHALL be shown

### Requirement: Vehicle Status Display

The system SHALL display vehicle operational status using the enum: `in-use`, `ready`, `maintenance`, `out-of-service`, `reserved`.

#### Scenario: Status visible on fleet list

- **GIVEN** vehicles exist with various statuses
- **WHEN** a user views `/fleet`
- **THEN** each vehicle SHALL show a status badge matching its stored status

#### Scenario: Direct status edit in vehicle form

- **GIVEN** the vehicle edit panel is open
- **WHEN** a fleet manager changes status and saves
- **THEN** the new status SHALL persist subject to rules in `vehicle-lifecycle` capability

### Requirement: Vehicle Search and Filtering

The system SHALL support searching and filtering vehicles on the fleet page.

#### Scenario: Filter vehicles by status

- **GIVEN** multiple vehicles exist with different statuses
- **WHEN** a user selects a status filter (including via `?status=ready` URL param)
- **THEN** only vehicles matching that status SHALL be shown

#### Scenario: Search vehicles by name or VIN

- **GIVEN** multiple vehicles exist in the fleet
- **WHEN** a user enters text in the fleet search field
- **THEN** vehicles whose name or VIN contains the query (case-insensitive) SHALL be returned
- **AND** an active status filter SHALL further narrow results when set

### Requirement: Vehicle Removal

The system SHALL allow removing a vehicle from the registry with explicit confirmation.

#### Scenario: Remove vehicle via edit panel

- **GIVEN** a vehicle exists and the edit panel is open
- **WHEN** the fleet manager completes slide-to-remove confirmation
- **THEN** the vehicle SHALL be removed from the registry
- **AND** the fleet list SHALL update without a full page reload
