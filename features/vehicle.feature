Feature: Vehicle Management
  As a fleet manager
  I want to register and manage vehicles
  So that the fleet registry stays accurate and assignable

  # Mirrors openspec/specs/vehicle/spec.md

  Scenario: Register a new vehicle successfully
    Given the fleet has no vehicle with id "v99"
    When I register a vehicle with:
      | name        | status |
      | Test Van 99 | ready  |
    Then the fleet should contain a vehicle named "Test Van 99"
    And the vehicle status should be "ready"

  Scenario: Prevent duplicate vehicle registration by id
    Given the fleet has a vehicle with id "v1" and name "Existing"
    When I attempt to register a vehicle with id "v1" and name "Duplicate"
    Then registration should be rejected with message containing "ID already exists"

  Scenario: Prevent duplicate vehicle registration by VIN
    Given the fleet has a vehicle with VIN "1HGBH41JXMN109186"
    When I attempt to register a vehicle with VIN "1hgbh41jxmn109186" and name "Dup VIN"
    Then registration should be rejected with message containing "VIN already exists"

  Scenario: Filter vehicles by status
    Given the fleet has vehicles:
      | id | name  | status      |
      | v1 | Alpha | ready       |
      | v2 | Beta  | maintenance |
    When I filter vehicles by status "ready"
    Then the filtered vehicle ids should be "v1"

  Scenario: Search vehicles by name or VIN
    Given the fleet has vehicles:
      | id | name     | vin               | status |
      | v1 | Sprinter | 1HGBH41JXMN109186 | ready  |
      | v2 | Transit  |                   | ready  |
    When I search vehicles for "sprinter"
    Then the filtered vehicle ids should be "v1"
    When I search vehicles for "109186"
    Then the filtered vehicle ids should be "v1"
