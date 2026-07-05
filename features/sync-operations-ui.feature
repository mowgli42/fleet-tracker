Feature: Sync Operations UI
  As an operator
  I want sync health visibility
  So that I can trust offline shop-floor work

  Scenario: Projection source label when offline
    When sync projection source is "local"
    Then projection label should be "local event log"

  Scenario: Projection source label when online
    When sync projection source is "cloud"
    Then projection label should be "cloud projection"

  Scenario: Outbox depth in status report
    Given a sync report with outbox count 3
    Then the report should expose outbox depth

  Scenario: Flush error is surfaced
    Given last flush error "Network timeout"
    Then flush error should be shown
