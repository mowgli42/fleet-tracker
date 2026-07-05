Feature: Cloud Multi-Site Demo
  As a fleet owner
  I want multi-site rollup
  So that I can see critical work across locations

  Scenario: Demo disclaimer applies
    Then cloud rollup should be demo mode

  Scenario: Critical jobs on site
    Given a critical open job "j1" for vehicle "v1" at site "site-north"
    When I list critical jobs for site "site-north"
    Then critical job ids should include "j1"

  Scenario: Critical parts on site
    Given a critical open job "j1" for vehicle "v1" at site "site-north"
    And cloud part order "Brake kit" linked to job "j1" with status "ordered"
    When I list critical parts for site "site-north"
    Then critical part names should include "Brake kit"
