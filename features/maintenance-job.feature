Feature: Maintenance Job
  As a fleet manager
  I want work order lifecycle rules
  So that maintenance jobs follow CMMS status machine

  Scenario: Create job with required fields
    Given no maintenance jobs exist
    When I create a maintenance job for vehicle "v1" titled "Oil change"
    Then a maintenance job should exist for vehicle "v1" with status "open"

  Scenario: Reject job without vehicle
    When I attempt to create a maintenance job without a vehicle titled "Bad job"
    Then job creation should be rejected with message containing "vehicle"

  Scenario: Transition to in-progress
    Given a maintenance job "j1" for vehicle "v1" with status "open"
    When I change job "j1" status to "in-progress"
    Then job "j1" status should be "in-progress"

  Scenario: Complete job sets completedAt
    Given a maintenance job "j2" for vehicle "v1" with status "in-progress"
    When I change job "j2" status to "completed"
    Then job "j2" status should be "completed"
    And job "j2" should have completedAt set

  Scenario: Timeline view orders by due date
    Given maintenance jobs:
      | id | vehicleId | createdAt  | dueDate    |
      | j1 | v1        | 2026-01-01 | 2026-02-01 |
      | j2 | v1        | 2026-01-15 | 2026-01-20 |
    When I sort jobs for timeline view
    Then timeline job ids should be "j2,j1"
