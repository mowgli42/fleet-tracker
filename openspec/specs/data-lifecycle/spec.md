# Data Lifecycle (Backup and Archive)

## Purpose

**Backup, restore, and archival** of fleet data for sold/retired vehicles and completed jobs — CMMS and compliance require durable records beyond browser `localStorage`. See `docs/PROPOSAL-PRODUCTION-READINESS.md`.

**Phase:** 3 — specification only.

## Requirements

### Requirement: Scheduled backup

Production deployments SHALL backup fleet data on a defined schedule.

#### Scenario: Daily backup export

- **GIVEN** production mode is enabled
- **WHEN** the backup job runs
- **THEN** a snapshot of vehicles, jobs, parts, and events SHALL be written to durable storage

### Requirement: Restore from backup

Operators SHALL restore from a known-good snapshot.

#### Scenario: Point-in-time restore

- **GIVEN** a valid backup snapshot exists
- **WHEN** an operator initiates restore
- **THEN** fleet data SHALL match the snapshot as of backup time

### Requirement: Archive retired vehicles

Sold or retired vehicles SHALL move to archive, not hard delete.

#### Scenario: Archive vehicle preserves history

- **GIVEN** a vehicle is marked retired
- **WHEN** archive runs
- **THEN** the vehicle SHALL be hidden from active fleet lists
- **AND** maintenance history SHALL remain queryable

### Requirement: Job retention policy

The system SHALL support moving completed jobs older than the retention window to cold archive.

#### Scenario: Archive old completed jobs

- **GIVEN** jobs completed more than N years ago
- **WHEN** retention job runs
- **THEN** jobs SHALL move to archive store with searchable metadata
