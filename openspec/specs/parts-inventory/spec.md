# Parts Inventory (Orders)

## Purpose

Track **parts on order** linked to maintenance jobs — CMMS practice of connecting **inventory consumption** to work orders for cost control and reducing **waiting-parts downtime**. Phase 1 models order lifecycle (ordered → shipped → received), not full stock levels or vendor catalogs.

## Requirements

### Requirement: Create parts order

The system SHALL allow ordering parts with quantity and optional job linkage.

#### Scenario: Order part successfully

- **GIVEN** the parts page is open
- **WHEN** a user submits part name, quantity, and order date
- **THEN** a part order SHALL be created with status `ordered`
- **AND** it SHALL appear in the parts list

#### Scenario: Link part to maintenance job

- **GIVEN** a maintenance job exists
- **WHEN** `maintenanceJobId` is set on a part order
- **THEN** the part SHALL appear in the job expansion and edit context
- **AND** the parts page SHALL show the related job reference

### Requirement: Parts order status progression

Orders SHALL advance: `ordered` → `shipped` → `received`.

#### Scenario: Mark shipped

- **GIVEN** a part order with status `ordered`
- **WHEN** status is updated to `shipped`
- **THEN** status SHALL persist
- **AND** `expectedDelivery` MAY be updated

#### Scenario: Mark received

- **GIVEN** a part order with status `shipped` or `ordered`
- **WHEN** status is updated to `received`
- **THEN** `receivedAt` SHALL be set if not already present
- **AND** linked jobs MAY transition from `waiting-parts` to `in-progress`

### Requirement: Parts gate job workflow

Tablet and desktop workflows SHALL surface parts blocking state.

#### Scenario: Critical parts heuristic on cloud rollup

- **GIVEN** parts orders are `ordered` or `shipped` for jobs marked critical
- **WHEN** the cloud multi-site view loads
- **THEN** those parts SHALL contribute to critical-parts indicators (demo heuristic)

### Requirement: Parts removal

Part orders SHALL be removable from the edit panel with slide-to-remove confirmation.

#### Scenario: Remove part order

- **GIVEN** the part edit panel is open
- **WHEN** slide-to-remove completes
- **THEN** the order SHALL be deleted
- **AND** job links SHALL be cleared

### Requirement: Quantity used on job

When a part is consumed on a job, quantity used SHALL be recordable for cost/configuration tracking.

#### Scenario: Record quantity used

- **GIVEN** a received part linked to a job
- **WHEN** `quantityUsed` is set on the part order
- **THEN** the value SHALL persist for reporting
