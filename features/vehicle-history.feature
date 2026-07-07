Feature: Vehicle History
  As a fleet manager
  I want per-vehicle maintenance history
  So that asset records support audits and analysis

  Scenario: List jobs ordered by date descending
    Given history jobs for vehicle "v1":
      | id | createdAt  | completedAt |
      | j1 | 2026-01-01 | 2026-01-05  |
      | j2 | 2026-02-01 |             |
    When I build vehicle history for "v1" newest first
    Then history job ids should be "j2,j1"

  Scenario: Highlight current open job
    Given history jobs for vehicle "v1":
      | id | status      |
      | j1 | in-progress |
    And vehicle "v1" current job is "j1"
    When I build vehicle history for "v1" newest first
    Then history marks job "j1" as current open

  Scenario: Show odometer at job events
    Given a history job "j1" with odometer open 50000 and completion 50100
    When I display odometer for job "j1"
    Then odometer display should prefer completion 50100
