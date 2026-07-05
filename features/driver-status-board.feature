Feature: Driver Status Board
  As a driver
  I want a read-only tracking page
  So that I can see maintenance progress

  Scenario: Generate tracking token
    When tracking is enabled for vehicle "v1" driver "Sam"
    Then a tracking token should be issued for "v1"

  Scenario: Token not enumerable
    When token guess "12345" is validated
    Then token resolution should be null

  Scenario: Show job status read-only
    Given vehicle "v1" named "Van 1" in maintenance
    And driver open job titled "Brake work" with status "in-progress"
    When driver status view is built
    Then status view should be read-only
    And status text should mention progress
