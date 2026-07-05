Feature: Parts Inventory
  As a parts coordinator
  I want parts orders linked to jobs
  So that waiting-parts downtime is visible

  Scenario: Order part successfully
    Given no part orders exist
    When I create a part order "Brake pads" quantity 2
    Then a part order "Brake pads" should exist with status "ordered"

  Scenario: Link part to maintenance job
    Given a maintenance job "j1" exists
    When I create a part order "Filter" linked to job "j1"
    Then part orders for job "j1" should include "Filter"

  Scenario: Mark received sets receivedAt
    Given a part order "po1" with status "shipped"
    When I advance part "po1" status to "received"
    Then part "po1" status should be "received"
    And part "po1" should have receivedAt set

  Scenario: Received parts unblock waiting job
    Given a maintenance job "j1" with status "waiting-parts"
    And part order "po1" linked to job "j1" with status "shipped"
    When I advance part "po1" status to "received"
    Then the parts job "j1" status should be "in-progress"
