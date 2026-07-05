# Driver Status Board

## Purpose

**Read-only status board** for drivers tracking assigned vehicle maintenance — production feature from `docs/PROPOSAL-PRODUCTION-READINESS.md`. Unique unguessable URLs per assignment; no login required for view-only access.

**Phase:** 3 — specification only.

## Requirements

### Requirement: Unique tracking URL

Each active assignment SHALL have a unique public URL.

#### Scenario: Generate tracking token

- **GIVEN** a vehicle is checked out to a driver
- **WHEN** tracking is enabled
- **THEN** the system SHALL issue a URL containing an unguessable token

#### Scenario: Token not enumerable

- **GIVEN** an attacker guesses sequential ids
- **WHEN** they request tracking pages
- **THEN** invalid tokens SHALL return 404 without leaking existence

### Requirement: Read-only status display

Drivers SHALL see maintenance progress without edit rights.

#### Scenario: Show job status and ETA

- **GIVEN** a valid tracking URL
- **WHEN** the driver opens the page
- **THEN** vehicle name, current job status, and plain-language status text SHALL display
- **AND** no mutation controls SHALL be present

### Requirement: Privacy boundary

Tracking pages SHALL expose only assignment-scoped data.

#### Scenario: No other fleet vehicles visible

- **GIVEN** a driver tracking URL for vehicle V
- **WHEN** the page loads
- **THEN** no other vehicles or jobs SHALL be listed
