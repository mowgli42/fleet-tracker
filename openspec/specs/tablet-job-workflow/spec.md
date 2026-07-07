# Tablet Job Workflow

## Purpose

Guide technicians through **parts → shop work → return-to-service** on the shop floor. CMMS work-order execution: ensure parts are available, work is documented, and vehicles are not released until checklists pass.

## Requirements

### Requirement: Job workflow route

Each active job SHALL have a tablet workflow at `/tablet/job/[jobId]`.

#### Scenario: Open job workflow

- **GIVEN** a maintenance job exists
- **WHEN** the user navigates to `/tablet/job/{jobId}`
- **THEN** a multi-step workflow SHALL load for that job

### Requirement: Parts step

The workflow SHALL surface parts status before work.

#### Scenario: Parts step shows linked orders

- **GIVEN** parts orders link to the job
- **WHEN** the parts step is active
- **THEN** order status (ordered/shipped/received) SHALL be visible
- **AND** unreceived parts SHALL block or warn on advance

### Requirement: Shop work step

Technicians SHALL update job progress from tablet.

#### Scenario: Mark in progress from tablet

- **GIVEN** the job is `open`
- **WHEN** the technician starts shop work
- **THEN** status MAY transition to `in-progress`
- **AND** `updatedAt` SHALL advance

### Requirement: Return-to-service checklist

Release SHALL require explicit checklist completion.

#### Scenario: Checklist gates completion

- **GIVEN** the return-to-service step is active
- **WHEN** required checklist items are incomplete
- **THEN** completing the job or releasing the vehicle SHALL be blocked

#### Scenario: Complete job after checklist

- **GIVEN** all required checklist items are checked
- **WHEN** the technician completes return-to-service
- **THEN** the job MAY be marked `completed`
- **AND** vehicle release MAY be offered per `vehicle-lifecycle`

### Requirement: Workflow stepper UX

The tablet workflow SHALL show progress across steps.

#### Scenario: Stepper indicates current step

- **GIVEN** a multi-step job workflow
- **WHEN** the user is on step 2 of 3
- **THEN** `TabletWorkflowStepper` SHALL highlight the current step
