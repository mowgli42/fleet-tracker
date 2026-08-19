Feature: Offline Sync
  As a shop-floor operator
  I want local-first event capture and cloud replay
  So that maintenance work continues during connectivity outages

  Scenario: Valid maintenance event accepted
    Given a valid maintenance event envelope
    When I validate the event envelope
    Then envelope validation should succeed

  Scenario: Missing event_id rejected
    Given a valid maintenance event envelope with empty event_id
    When I validate the event envelope
    Then envelope validation should fail with a non-empty reason

  Scenario: Invalid entity_type rejected
    Given a valid maintenance event envelope with entity_type "invalid"
    When I validate the event envelope
    Then envelope validation should fail

  Scenario: Event survives append
    Given a clean sync store
    And a valid maintenance event envelope
    When I append and queue the event
    Then the event should appear in the local log
    And the event should appear in the outbox

  Scenario: Invalid event not appended
    Given a clean sync store
    And a valid maintenance event envelope with empty event_id
    When I append and queue the event
    Then append and queue should throw
    And the local log should be empty
    And the outbox should be empty

  Scenario: First accept succeeds
    Given a clean cloud state
    And a valid maintenance event envelope
    When I accept the event on cloud with correct site key
    Then cloud accept status should be "accepted"
    And the stored event should have event_ts_server set

  Scenario: Duplicate idempotency key is no-op
    Given a clean cloud state
    And a valid maintenance event envelope
    When I accept the event on cloud with correct site key
    And I accept the event on cloud with correct site key
    Then cloud should contain exactly 1 event
    And cloud accept status should be "duplicate"

  Scenario: Wrong site key rejected
    Given a clean cloud state
    And a valid maintenance event envelope
    When I accept the event on cloud with site key "wrong-secret"
    Then cloud accept status should be "rejected"
    And the reject reason should be auth-related

  Scenario: Flush drains outbox on success
    Given a clean sync store
    And cloud is online
    And a valid maintenance event envelope is queued in the outbox
    When I flush the outbox to cloud
    Then the outbox depth should be 0
    And cloud should contain those queued events

  Scenario: Flush skipped when cloud offline
    Given a clean sync store
    And cloud is offline
    And a valid maintenance event envelope is queued in the outbox
    When I flush the outbox to cloud
    Then the outbox depth should be 1
    And the event should remain in the local log

  Scenario: Backoff after error
    Given a flush backoff state
    When a flush attempt returns lastError at time 1000000
    Then flush should not be attempted at time 1000999
    And flush should be attempted at time 1001000

  Scenario: Backoff resets on success
    Given a flush backoff state with a prior error at time 0
    When a subsequent flush succeeds
    Then flush backoff should reset to the base interval

  Scenario: Server time ordering
    Given two events with different event_ts_server values
    When I sort events for replay
    Then the earlier server timestamp should sort first

  Scenario: Causal version tie-break
    Given two events for the same entity with equal event_ts_server
    When I sort events for replay
    Then the lower causal_version should sort first
