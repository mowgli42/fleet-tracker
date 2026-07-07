# Inspections and Compliance (DVIR)

## Purpose

Structured **driver vehicle inspection reports (DVIR)** and defect-to-work-order conversion — CMMS/fleet compliance standard (DOT, OSHA). Extends `tablet-shop-floor` with regulatory-grade forms, signatures, and automatic work order creation from failed items.

**Phase:** 3 — specification only.

## Requirements

### Requirement: Pre-trip inspection form

Drivers or technicians SHALL complete a configurable inspection checklist.

#### Scenario: Submit passing inspection

- **GIVEN** all checklist items pass
- **WHEN** the inspection is submitted
- **THEN** an inspection record SHALL be stored with timestamp and vehicle id
- **AND** no work order SHALL be created

#### Scenario: Failed item creates defect

- **GIVEN** one or more checklist items fail
- **WHEN** the inspection is submitted
- **THEN** each failed item SHALL create a defect record
- **AND** defects SHALL be linkable to new maintenance jobs

### Requirement: Defect to work order

Failed inspections SHALL convert to trackable work orders.

#### Scenario: Auto-create job from critical defect

- **GIVEN** a defect marked critical
- **WHEN** the inspection is submitted
- **THEN** an open maintenance job SHALL be created with `planned: false`
- **AND** vehicle availability SHALL become blocked

### Requirement: Inspection history per vehicle

Inspections SHALL appear in vehicle history.

#### Scenario: List inspections on history report

- **GIVEN** inspections exist for a vehicle
- **WHEN** vehicle history loads
- **THEN** inspection records SHALL be listed alongside maintenance jobs

### Requirement: Regulatory export

Fleet managers SHALL export inspection logs for audit.

#### Scenario: Export date range

- **GIVEN** inspections exist in a date range
- **WHEN** export is requested
- **THEN** a machine-readable file (CSV or PDF) SHALL be generated
