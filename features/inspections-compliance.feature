Feature: Inspections and Compliance
  As a compliance manager
  I want DVIR inspections
  So that defects become trackable work orders

  Scenario: Submit passing inspection
    When I submit a passing inspection for vehicle "v1"
    Then inspection for "v1" should pass
    And no defect jobs should be created

  Scenario: Failed item creates defect
    When I submit inspection for "v1" with failed item "Brakes" non-critical
    Then inspection for "v1" should fail
    And defects should include "Brakes"

  Scenario: Critical defect creates job
    When I submit inspection for "v1" with failed critical item "Steering"
    Then an open job should be created for "v1"
    And availability should be blocked

  Scenario: Export inspections CSV
    Given an inspection exists for vehicle "v1"
    When inspections are exported
    Then export should include header row
