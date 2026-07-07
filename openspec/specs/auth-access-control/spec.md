# Auth and Access Control

## Purpose

Production **authentication, authorization, and site-scoped access** — required before multi-tenant or internet-facing deployment (`docs/PROPOSAL-PRODUCTION-READINESS.md`). Phase 1 uses open mockup; Phase 3 SHALL enforce roles on all mutating operations.

**Phase:** 3 — specification only.

## Requirements

### Requirement: Authenticated sessions

The system SHALL require authentication for all write operations in production.

#### Scenario: Unauthenticated write rejected

- **GIVEN** no valid session
- **WHEN** a client attempts to create or update fleet data via API
- **THEN** the request SHALL be rejected with 401

### Requirement: Role-based permissions

The system SHALL support at minimum: `admin`, `shop_manager`, `technician`, `driver` (read-only).

#### Scenario: Technician cannot delete vehicles

- **GIVEN** a user with role `technician`
- **WHEN** they attempt to remove a vehicle
- **THEN** the operation SHALL be denied

#### Scenario: Driver read-only fleet view

- **GIVEN** a user with role `driver`
- **WHEN** they access fleet routes
- **THEN** they SHALL see assigned vehicle status only
- **AND** mutations SHALL be denied

### Requirement: Site-scoped data access

Users SHALL only access vehicles and jobs for authorized sites.

#### Scenario: Cross-site read denied

- **GIVEN** a user authorized for site A only
- **WHEN** they request site B vehicle data
- **THEN** access SHALL be denied

### Requirement: Audit actor on sync events

Sync events SHALL record authenticated `actor_id` in production.

#### Scenario: Actor matches session user

- **GIVEN** an authenticated user performs a maintenance action
- **WHEN** a sync event is emitted
- **THEN** `actor_id` SHALL match the user identity
