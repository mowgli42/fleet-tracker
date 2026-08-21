# Fleet Schedule

## Purpose

Show every vehicle grouped by site against a rolling 24 / 48 / 72 hour status bar so a planner can see the next job and which scheduled PM blocks can slide to free people or bays for unscheduled work.

## Requirements

### Requirement: Site-grouped rolling horizon

The schedule view SHALL group vehicles by site and project each vehicle onto a now-relative 24, 48, or 72 hour window.

#### Scenario: Ready vehicle is available across the window

- **GIVEN** a ready vehicle with no open jobs
- **WHEN** the 24 hour schedule is built
- **THEN** the vehicle SHALL have a single `available` segment

#### Scenario: Vehicles are grouped by site

- **GIVEN** vehicles assigned to North Bay, South Loop, and Central Depot
- **WHEN** the fleet schedule is built
- **THEN** each vehicle SHALL appear under its site group

### Requirement: Status colors

Segments SHALL use these kinds: `available`, `assigned`, `scheduled_maint`, `relocation`, `unscheduled_maint`.

#### Scenario: In-use is assigned

- **GIVEN** a vehicle with status `in-use`
- **WHEN** the schedule is built
- **THEN** the first segment SHALL be `assigned`

#### Scenario: Reserved is relocation

- **GIVEN** a vehicle with status `reserved`
- **WHEN** the schedule is built
- **THEN** the first segment SHALL be `relocation`

#### Scenario: Unplanned open job is unscheduled

- **GIVEN** a vehicle with an open unplanned maintenance job
- **WHEN** the schedule is built
- **THEN** the first segment SHALL be `unscheduled_maint` labeled with the job title

### Requirement: Defer scheduled maintenance after unscheduled work

When a vehicle has both unscheduled work and later planned PM, the planned block SHALL start after the unscheduled block so a planner can see what can be pushed out.

#### Scenario: Planned PM slides after unscheduled work

- **GIVEN** a vehicle with an open unplanned job and an open planned job
- **WHEN** the 72 hour schedule is built
- **THEN** the `scheduled_maint` segment SHALL start at or after the unscheduled segment ends
- **AND** the row SHALL be marked as able to defer scheduled maintenance
