# Cloud Multi-Site (Owner Demo)

## Purpose

Provide an **owner rollup** across demo sites for fleet composition and critical maintenance/parts — a thin multi-site lens before full `fleet-availability` projection is wired to `/cloud`. Phase 1 demo only; not the authoritative owner read model (see `fleet-availability` + `offline-sync`).

## Requirements

### Requirement: Multi-site landing

The system SHALL list demo sites on `/cloud`.

#### Scenario: Site cards

- **GIVEN** demo site data exists in `multiSiteDemo`
- **WHEN** the user opens `/cloud`
- **THEN** each site SHALL show name, vehicle count summary, and link to site detail

### Requirement: Per-site detail

Each site SHALL expose fleet and critical work summary.

#### Scenario: Site fleet composition

- **GIVEN** a site id in the demo dataset
- **WHEN** the user opens `/cloud/site/[siteId]`
- **THEN** vehicle status breakdown for that site SHALL be shown

#### Scenario: Critical jobs on site

- **GIVEN** jobs marked critical exist for site vehicles
- **WHEN** site detail loads
- **THEN** critical open jobs SHALL be listed

### Requirement: Demo data boundary

Cloud rollup SHALL use demo seed data, not live sync projection, until Phase 2 integration.

#### Scenario: Demo disclaimer

- **GIVEN** `/cloud` is not wired to cloud event projection
- **WHEN** the page loads
- **THEN** the UI SHALL treat data as illustrative demo rollup (not converged global state)

### Requirement: Critical parts heuristic

Site view SHALL highlight parts affecting critical jobs.

#### Scenario: Critical parts list

- **GIVEN** parts orders are open for critical jobs on the site
- **WHEN** site detail renders
- **THEN** a critical parts section SHALL list those orders
