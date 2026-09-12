Feature: Fleet Schedule
  As a shop planner
  I want vehicles grouped by site on a 24-48-72 hour status bar
  So that I can see the next job and which scheduled PM can slide for unscheduled work

  Scenario: Ready vehicle is available across the window
    Given a ready vehicle "v1" with no open jobs
    When I build the 24 hour schedule
    Then vehicle "v1" should have a single "available" segment

  Scenario: Vehicles are grouped by site
    Given vehicles "v1", "v5", and "v8" in the demo sites
    When I build the 48 hour fleet schedule
    Then the schedule groups should be "North Bay", "South Loop", and "Central Depot"

  Scenario: In-use is assigned
    Given an in-use vehicle "v1" driven by "J. Martinez"
    When I build the 24 hour schedule
    Then the first segment for "v1" should be "assigned"

  Scenario: Reserved is relocation
    Given a reserved vehicle "v8"
    When I build the 24 hour schedule
    Then the first segment for "v8" should be "relocation"

  Scenario: Unplanned open job is unscheduled
    Given a maintenance vehicle "v3" with an open unplanned job "Brake pad replacement"
    When I build the 72 hour schedule
    Then the first segment for "v3" should be "unscheduled_maint" labeled "Brake pad replacement"

  Scenario: Planned PM slides after unscheduled work
    Given a maintenance vehicle "v9" with an open unplanned job "Oil leak"
    And an open planned job "Tire rotation" for "v9"
    When I build the 72 hour schedule
    Then the scheduled segment for "v9" should start after unscheduled work
    And vehicle "v9" should be marked able to defer scheduled maintenance
