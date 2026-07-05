# Tablet Shop Floor (Intake)

## Purpose

Touch-first **shop-floor intake** for technicians — identify vehicle, run inspection checklist, optionally create job. Aligns with CMMS **mobile inspections** practice (precursor to full DVIR in `inspections-compliance`).

## Requirements

### Requirement: Tablet intake route

The system SHALL provide `/tablet/intake` as a guided workflow.

#### Scenario: Three-step intake flow

- **GIVEN** the user opens tablet intake
- **WHEN** they progress through steps
- **THEN** the flow SHALL include identify → inspect → optional job/pull-for-service

### Requirement: Vehicle identification

Technicians SHALL find vehicles by search or VIN.

#### Scenario: Search fleet from tablet

- **GIVEN** vehicles exist
- **WHEN** the user searches by name or VIN on intake step 1
- **THEN** matching vehicles SHALL be selectable

### Requirement: Inspection checklist

Intake SHALL capture a structured inspection before work.

#### Scenario: Complete checklist items

- **GIVEN** a vehicle is selected
- **WHEN** the user checks inspection items on step 2
- **THEN** checklist state SHALL be captured for the session
- **AND** incomplete critical items MAY warn before proceeding

### Requirement: Optional job creation on intake

Intake SHALL support creating or linking a maintenance job when the user confirms pull-for-service.

#### Scenario: Pull for service creates job

- **GIVEN** inspection is complete
- **WHEN** the user confirms pull-for-service
- **THEN** a maintenance job MAY be created
- **AND** vehicle lifecycle intake rules SHALL apply

### Requirement: Tablet navigation shell

Tablet routes SHALL use touch-optimized layout separate from desktop shell.

#### Scenario: Tablet layout without desktop sync bar

- **GIVEN** the user is on `/tablet/*`
- **WHEN** the page loads
- **THEN** tablet layout SHALL render without requiring desktop navigation chrome
