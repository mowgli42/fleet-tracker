Feature: Vehicle Lifecycle
  As a fleet manager
  I want intake, checkout, and release workflows
  So that vehicle movements are gated and traceable

  Scenario: Intake creates job and sets maintenance status
    Given a lifecycle vehicle "v1" with status "ready"
    And the vehicle "v1" has odometer 50000
    When I intake vehicle "v1" for maintenance
    Then vehicle "v1" status should be "maintenance"
    And vehicle "v1" should have an open maintenance job
    And the open job should record odometer at open 50000

  Scenario: Checkout requires driver
    Given a lifecycle vehicle "v2" with status "ready"
    When I attempt checkout for vehicle "v2" without a driver
    Then lifecycle action should be rejected with message containing "driver"

  Scenario: Successful checkout
    Given a lifecycle vehicle "v3" with status "ready"
    When I checkout vehicle "v3" to driver "Alex"
    Then vehicle "v3" status should be "in-use"
    And vehicle "v3" driver should be "Alex"

  Scenario: Release blocked with open job
    Given a lifecycle vehicle "v4" with status "maintenance"
    And vehicle "v4" has an open maintenance job
    When I attempt release for vehicle "v4"
    Then lifecycle action should be rejected with message containing "open"

  Scenario: Successful release
    Given a lifecycle vehicle "v5" with status "maintenance"
    And vehicle "v5" has no open maintenance jobs
    When I release vehicle "v5"
    Then vehicle "v5" status should be "ready"
