Feature: Dashboard Analytics
  As a fleet manager
  I want KPI summaries on the dashboard
  So that I can prioritize operations

  Scenario: Fleet availability percent
    Given vehicles:
      | id | status      |
      | v1 | ready       |
      | v2 | in-use      |
      | v3 | maintenance |
    When I compute dashboard metrics
    Then fleet availability percent should be 67

  Scenario: Unplanned maintenance percent uses completed jobs
    Given completed jobs:
      | id | planned |
      | j1 | true    |
      | j2 | false   |
      | j3 | false   |
    When I compute dashboard metrics
    Then unplanned percent should be 67

  Scenario: Parts status includes received
    Given parts:
      | id  | status   |
      | p1  | ordered  |
      | p2  | received |
    When I compute dashboard metrics
    Then parts by status received count should be 1
