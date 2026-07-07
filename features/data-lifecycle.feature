Feature: Data Lifecycle
  As an operator
  I want backup and archive
  So that fleet records remain compliant

  Scenario: Daily backup export
    Given a fleet with 2 vehicles and 3 jobs
    When a backup snapshot is created
    Then backup should include 2 vehicles and 3 jobs

  Scenario: Archive retired vehicle preserves history
    Given fleet vehicle "v1" with 2 jobs
    When vehicle "v1" is archived
    Then active fleet should not contain "v1"
    And archive should contain vehicle "v1" with 2 jobs

  Scenario: Archive old completed jobs
    Given a job "j1" completed 8 years ago
    When retention runs with 7 year window
    Then active jobs should not include "j1"
    And archive jobs should include "j1"
