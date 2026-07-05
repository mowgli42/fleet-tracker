# Sync Operations UI

## Purpose

Give operators a **transparent view** of local sync health — queue depth, projection source, flush errors, and event log stats. CMMS operators need visibility when the shop continues working offline; this surface builds trust during outage simulation and demo.

## Requirements

### Requirement: Cloud online toggle

Operators SHALL simulate or reflect cloud connectivity.

#### Scenario: Toggle cloud offline

- **GIVEN** the user is on `/sync`
- **WHEN** they toggle **Cloud offline**
- **THEN** `cloudOnline` SHALL persist in `localStorage`
- **AND** outbox flush SHALL stop until back online

### Requirement: Outbox and log visibility

The sync page SHALL show queue and log metrics.

#### Scenario: Outbox depth displayed

- **GIVEN** events are queued
- **WHEN** `/sync` loads
- **THEN** outbox count SHALL be visible

#### Scenario: Local log stats

- **GIVEN** local events exist
- **WHEN** the sync status report builds
- **THEN** event count and approximate log size SHALL be shown

### Requirement: Projection source indicator

The UI SHALL show whether readiness uses local or cloud events.

#### Scenario: Projection source label

- **GIVEN** cloud is offline
- **WHEN** owner availability section renders
- **THEN** copy SHALL indicate **local event log** as projection source
- **WHEN** cloud is online
- **THEN** copy SHALL indicate **cloud projection**

### Requirement: Flush error surfacing

Last sync flush errors SHALL be visible for troubleshooting.

#### Scenario: Display last flush error

- **GIVEN** the last flush returned an error
- **WHEN** `/sync` renders
- **THEN** the error message SHALL be shown prominently

### Requirement: Manual refresh

Operators SHALL force a sync snapshot refresh.

#### Scenario: Refresh button

- **GIVEN** the user clicks **Refresh** on `/sync`
- **WHEN** refresh completes
- **THEN** outbox flush attempt, cloud fetch, and readiness counts SHALL update
- **AND** `lastUpdatedAt` SHALL advance

### Requirement: Shell sync status bar

The main layout SHALL expose compact sync status.

#### Scenario: Sync status bar in app shell

- **GIVEN** `initSyncRuntime` is active on desktop routes
- **WHEN** the layout renders
- **THEN** `SyncStatusBar` SHALL show online/offline, pending count, and cloud accepted count
