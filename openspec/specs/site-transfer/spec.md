# Site Transfer (Cross-Site)

## Purpose

Support **cross-site vehicle transfer** when destination is offline — Phase 2 per `docs/OFFICE-HOURS-DESIGN-20260327.md`. CMMS/multi-location fleets need in-transit visibility so assets are not double-assigned. Events: `transfer_created`, `transfer_applied`.

**Phase:** 2 — spec defined before implementation.

## Requirements

### Requirement: Transfer creation event

A site SHALL record transfer intent when sending a vehicle to another site.

#### Scenario: Create transfer while destination offline

- **GIVEN** site A initiates transfer of vehicle V to site B
- **AND** site B is unreachable
- **WHEN** transfer is submitted
- **THEN** a `transfer_created` event SHALL be appended locally
- **AND** vehicle SHALL show **in-transit** state in owner view

### Requirement: Transfer apply on reconnect

Destination site SHALL apply transfer exactly once when connectivity returns.

#### Scenario: Auto-apply on destination reconnect

- **GIVEN** a pending `transfer_created` for vehicle V to site B
- **WHEN** site B reconnects and receives replayed events
- **THEN** a `transfer_applied` event SHALL be processed once
- **AND** vehicle ownership/site assignment SHALL update at site B

#### Scenario: Duplicate transfer idempotency

- **GIVEN** the same transfer is replayed with duplicate `idempotency_key`
- **WHEN** cloud accepts events
- **THEN** only one effective transfer application SHALL occur

### Requirement: In-transit visibility

Owner views SHALL show vehicles in transit until applied.

#### Scenario: In-transit blocks ready classification

- **GIVEN** a vehicle has unresolved in-transit transfer
- **WHEN** readiness is computed
- **THEN** the vehicle SHALL NOT count as **ready** at destination until `transfer_applied`

### Requirement: Stale transfer escalation

Transfers unresolved beyond SLA SHALL escalate.

#### Scenario: Stale in-transit timeout

- **GIVEN** in-transit duration exceeds demo SLA
- **WHEN** projection runs
- **THEN** vehicle SHALL be classified **blocked** or flagged for operator attention
