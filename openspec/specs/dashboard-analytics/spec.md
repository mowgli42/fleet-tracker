# Dashboard Analytics

## Purpose

Surface **fleet KPIs** on the home dashboard for operational decision-making — aligned with CMMS metrics: availability, PM compliance, MTTR, planned vs unplanned mix, and parts/jobs urgency. Definitions SHALL remain consistent with domain specs (`pm-scheduling`, `maintenance-job`, `fleet-availability`).

## Requirements

### Requirement: Fleet composition summary

The dashboard SHALL summarize vehicle counts by status.

#### Scenario: Stacked bar by vehicle status

- **GIVEN** vehicles exist in multiple statuses
- **WHEN** the dashboard loads
- **THEN** a stacked bar SHALL show counts for `in-use`, `ready`, `maintenance`, `out-of-service`, `reserved`
- **AND** colors SHALL match fleet status badges

### Requirement: Maintenance urgency summary

The dashboard SHALL highlight open work by priority.

#### Scenario: Open jobs by priority bar

- **GIVEN** open jobs exist with priorities low through critical
- **WHEN** the dashboard loads
- **THEN** a stacked bar SHALL show open job counts by priority

#### Scenario: Urgent maintenance table

- **GIVEN** jobs are due soon or critical priority
- **WHEN** the dashboard renders the urgent table
- **THEN** the highest-urgency jobs SHALL be listed with vehicle and due date

### Requirement: Availability metrics

The dashboard SHALL show fleet availability percentages.

#### Scenario: Fleet availability percent

- **GIVEN** vehicles are in `ready` or `in-use` vs total
- **WHEN** the dashboard loads
- **THEN** fleet availability % SHALL be displayed

#### Scenario: Unplanned maintenance percent

- **GIVEN** completed jobs with `planned` flag
- **WHEN** the dashboard loads
- **THEN** unplanned % SHALL reflect non-planned completed work in the reporting window

### Requirement: PM compliance metric

The dashboard SHALL display PM compliance per `pm-scheduling` rules.

#### Scenario: PM compliance card

- **GIVEN** vehicles have `nextService` dates
- **WHEN** the dashboard loads
- **THEN** PM compliance % SHALL be shown on the availability metrics row

### Requirement: MTTR and repair trends

The dashboard SHALL expose mean time to repair and component trends.

#### Scenario: MTTR display

- **GIVEN** completed jobs have `startedAt` and `completedAt`
- **WHEN** the dashboard loads
- **THEN** MTTR SHALL be computed and displayed for the demo dataset

#### Scenario: Repair trend by component chart

- **GIVEN** repair jobs have `component` set
- **WHEN** the dashboard loads
- **THEN** a chart SHALL show repair counts or trend by component

### Requirement: Parts on order summary

The dashboard SHALL summarize parts pipeline.

#### Scenario: Parts status stacked bar

- **GIVEN** part orders exist in `ordered`, `shipped`, `received`
- **WHEN** the dashboard loads
- **THEN** a stacked bar SHALL show parts counts by status

#### Scenario: Parts on order table

- **GIVEN** open part orders exist
- **WHEN** the dashboard loads
- **THEN** a table SHALL list parts with status and expected delivery

### Requirement: Sync health strip

When sync runtime is active, dashboard SHALL show cloud/outbox summary.

#### Scenario: Pending outbox on dashboard

- **GIVEN** the outbox has pending events
- **WHEN** the dashboard sync strip renders
- **THEN** pending count and last update time SHALL be visible
