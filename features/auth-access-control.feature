Feature: Auth and Access Control
  As a security administrator
  I want role-based permissions
  So that mutations are authorized in production

  Scenario: Unauthenticated write rejected
    When an unauthenticated user attempts "vehicle:create"
    Then authorization should fail with status 401

  Scenario: Technician cannot delete vehicles
    Given a user with role "technician"
    When they attempt "vehicle:delete"
    Then authorization should fail with status 403

  Scenario: Driver read-only
    Given a user with role "driver"
    When they attempt "vehicle:delete"
    Then authorization should fail with status 403
    And driver role may "fleet:read"

  Scenario: Cross-site read denied
    Given authorized vehicles "v1" only
    When access to vehicle "v99" is checked
    Then vehicle access should be denied
