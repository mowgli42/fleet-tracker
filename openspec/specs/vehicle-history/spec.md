# Vehicle History Report

## Purpose

Provide a **centralized, per-asset maintenance history** — CMMS best practice: complete vehicle records support warranty claims, resale value, repeat-failure analysis, and compliance audits. Aggregates jobs, odometer readings, and service metadata for one vehicle.

## Requirements

### Requirement: Per-vehicle history route

The system SHALL expose a dedicated history view per vehicle.

#### Scenario: Navigate to history from fleet

- **GIVEN** a vehicle exists on `/fleet`
- **WHEN** the user opens vehicle detail and selects history (or navigates to `/fleet/vehicle/[id]/history`)
- **THEN** a chronological report for that vehicle SHALL load

### Requirement: Job timeline content

History SHALL include all maintenance jobs for the vehicle.

#### Scenario: List completed and open jobs

- **GIVEN** a vehicle has jobs in various statuses
- **WHEN** history loads
- **THEN** jobs SHALL be listed with title, service type, status, dates, and component
- **AND** completed jobs SHALL show `completedAt` and `odometerAtCompletion` when present

#### Scenario: Order by date

- **GIVEN** multiple jobs exist
- **WHEN** history renders
- **THEN** jobs SHALL be ordered by relevant date (created or completed) descending or per view toggle

### Requirement: Odometer timeline

History SHALL show mileage at service events for usage-based PM analysis.

#### Scenario: Odometer at job open and complete

- **GIVEN** jobs have `odometerAtJobOpen` and `odometerAtCompletion`
- **WHEN** history displays each job
- **THEN** odometer values SHALL be shown when available

### Requirement: Link back to active work

History SHALL connect to current vehicle state.

#### Scenario: Highlight current open job

- **GIVEN** the vehicle has `currentJobId` set
- **WHEN** history loads
- **THEN** the linked open job SHALL be visually distinguished

#### Scenario: Return to fleet context

- **GIVEN** the user is on the history page
- **WHEN** they use navigation back to fleet
- **THEN** they SHALL return to `/fleet` with vehicle context preserved where applicable
