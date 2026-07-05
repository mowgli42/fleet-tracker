Feature: Site Transfer
  As a multi-site operator
  I want cross-site transfer events
  So that in-transit vehicles are not double-assigned

  Scenario: Create transfer while destination offline
    Given no transfer events exist
    When I create a transfer for vehicle "v1" from site "site-a" to site "site-b"
    Then vehicle "v1" should be in transit

  Scenario: Auto-apply on destination reconnect
    Given a pending transfer for vehicle "v1" to site "site-b"
    When transfer is applied for vehicle "v1"
    Then vehicle "v1" should not be in transit

  Scenario: In-transit blocks ready classification
    Given a pending transfer for vehicle "v1" to site "site-b"
    When I compute readiness for vehicle "v1"
    Then transfer readiness for vehicle "v1" should be "blocked"

  Scenario: Stale in-transit timeout
    Given a transfer for vehicle "v1" created 10 days ago
    When I compute readiness for vehicle "v1"
    Then transfer readiness for vehicle "v1" should be "blocked"
