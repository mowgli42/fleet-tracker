Feature: Tablet Shop Floor Intake
  As a technician
  I want guided tablet intake
  So that vehicles are identified and inspected before work

  Scenario: Search fleet from tablet
    Given intake vehicles:
      | id | name     | vin               |
      | v1 | Sprinter | 1HGBH41JXMN109186 |
    When I search intake for "109186"
    Then intake search results should be "v1"

  Scenario: Pull for service creates job and maintenance status
    Given intake vehicle "v1" with status "ready"
    When I complete intake with pull for service and issue "Brake noise"
    Then intake vehicle "v1" status should be "maintenance"
    And intake should have created a job for "v1"

  Scenario: Critical checklist warns
    Given an intake checklist with brakes unchecked
    Then intake critical warnings should include "Brakes"
