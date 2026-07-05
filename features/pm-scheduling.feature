Feature: PM Scheduling
  As a fleet owner
  I want PM at-risk classification
  So that preventive maintenance reduces breakdowns

  Scenario: Within 7-day window is at-risk
    Given a vehicle "v1" with nextService in 5 days
    And no blocking maintenance events for "v1"
    When I compute readiness for the fleet
    Then PM readiness for vehicle "v1" should be "at-risk"

  Scenario: PM compliance treats overdue nextService as non-compliant
    Given a vehicle "v1" with nextService "2026-01-01"
    And no qualifying PM jobs for "v1"
    When I compute PM compliance
    Then PM compliance percent should be 0

  Scenario: Qualifying PM after due date restores compliance
    Given a vehicle "v1" with nextService "2026-01-01"
    And a completed planned oil-change job for "v1" completed "2026-01-15"
    When I compute PM compliance
    Then PM compliance percent should be 100
