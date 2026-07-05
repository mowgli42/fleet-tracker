Feature: Tablet Job Workflow
  As a shop technician
  I want a guided job workflow
  So that parts and checklists gate release

  Scenario: Parts step blocks work until received
    Given a tablet job "j1" with status "open"
    And a tablet part order "po1" linked to job "j1" with status "ordered"
    When I evaluate shop work eligibility without override
    Then shop work should not be startable

  Scenario: Mark in progress from tablet
    Given a tablet job "j1" with status "open"
    And all parts received for job "j1"
    When I evaluate shop work eligibility without override
    Then shop work should be startable

  Scenario: Checklist gates completion
    Given a tablet job "j1" with status "in-progress"
    When the RTS checklist is incomplete
    Then return to service should be blocked

  Scenario: Complete job after checklist
    Given a tablet job "j1" with status "in-progress"
    When the RTS checklist is complete
    Then return to service should be allowed
