# Preventive Maintenance Scheduling

## Purpose

Support **usage-based and calendar-based PM** — industry standard for reducing unplanned breakdowns (target: higher PM compliance, lower emergency repair ratio). Phase 1 uses vehicle `nextService` date and odometer proximity to classify **at-risk** vehicles and dashboard **PM compliance**; Phase 2 MAY auto-generate work orders from schedules.

## Requirements

### Requirement: PM due date on vehicle

Each vehicle SHALL carry `lastService` and `nextService` for calendar PM tracking.

#### Scenario: Next service visible on fleet card

- **GIVEN** a vehicle has `nextService` set
- **WHEN** the fleet list renders
- **THEN** next service date SHALL be visible where the UI shows service fields

### Requirement: At-risk window

Vehicles approaching PM due SHALL be classified at-risk for owner availability (see `fleet-availability`).

#### Scenario: Within 7-day window is at-risk

- **GIVEN** `nextService` is within 7 days of today
- **AND** no blocking maintenance event exists
- **WHEN** readiness is computed
- **THEN** the vehicle class SHALL be `at-risk`

#### Scenario: Within mileage window is at-risk

- **GIVEN** vehicle odometer is within 300 miles of a mileage-based PM threshold when configured
- **WHEN** readiness is computed
- **THEN** the vehicle MAY be classified `at-risk` per `pmWindow` rules

### Requirement: PM risk sync event

When PM threshold is crossed, the system SHALL support emitting `pm_risk_set` for projection.

#### Scenario: Emit pm_risk_set when entering window

- **GIVEN** a vehicle crosses into the PM at-risk window
- **WHEN** the PM evaluation runs (manual or scheduled hook)
- **THEN** a `pm_risk_set` event with `active: true` MAY be appended to the sync log

#### Scenario: Clear pm risk after service

- **GIVEN** a completed PM job updates `nextService` to a future date
- **WHEN** PM is recalculated
- **THEN** a `pm_risk_set` event with `active: false` MAY be emitted

### Requirement: PM compliance KPI

Dashboard SHALL report PM compliance as a fleet health metric.

#### Scenario: PM compliance percentage

- **GIVEN** vehicles have `nextService` dates and completed PM jobs exist
- **WHEN** the dashboard loads
- **THEN** a PM compliance metric SHALL be displayed
- **AND** the calculation SHALL treat overdue `nextService` as non-compliant unless a qualifying PM job completed after the due date

### Requirement: Service-type aware PM jobs

PM work orders SHALL use appropriate `serviceType` values.

#### Scenario: Oil change PM job type

- **GIVEN** a scheduled oil service is recorded
- **WHEN** the job is created or completed
- **THEN** `serviceType` SHALL be `oil-change` or `fluid-change`
- **AND** `planned` SHALL be true
