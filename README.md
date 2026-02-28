# Fleet Tracker

A mockup car fleet management webtool built with SvelteKit and JSON. Tracks vehicle status, open maintenance jobs (with priority and history), and parts on order.

**v2.0** — Redesigned with the frontend-design skill: industrial/utilitarian aesthetic, Sora + DM Sans typography, cohesive palette (teal accent, CSS variables), compact top-anchored layout, staggered reveals, and refined accessibility (focus states, semantics).

## Screenshots

| Dashboard | Fleet |
|-----------|-------|
| [![Dashboard](docs/dashboard.png)](docs/dashboard.png) | [![Fleet](docs/fleet.png)](docs/fleet.png) |

| Maintenance | Parts |
|-------------|-------|
| [![Maintenance](docs/maintenance.png)](docs/maintenance.png) | [![Parts](docs/parts.png)](docs/parts.png) |

- **Dashboard** — Summary cards with **stacked bar charts** (vehicles by status, open jobs by priority, parts on order by status; colors match status badges), availability metrics (fleet %, unplanned %, MTTR, PM compliance), repair trend by component chart, urgent maintenance table, and parts on order table.
- **Fleet** — Vehicle grid/list with status filter and optional `?status=ready`; edit (pencil) and remove (slide in edit panel only).
- **Maintenance** — Default view **By type**; open jobs with priority/status, due date, time in state; **New job** to create; edit (pencil) and remove (slide in edit panel only); expandable history and parts.
- **Parts** — **Order part** to add; edit (pencil) and remove (slide in edit panel only); link to maintenance jobs.

See **[docs/JOB-WORKFLOW.md](docs/JOB-WORKFLOW.md)** for a step-by-step guide and screenshots that explain the job workflow.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build (static site)

```bash
npm run build
npm run preview
```

Output is in the `build/` directory.

## Features

- **Dashboard** – Summary cards with stacked bar charts (vehicles by status, open jobs by priority, parts by status; colors match badges), availability metrics (fleet %, unplanned %, MTTR, PM compliance), repair trend by component chart, urgent maintenance and parts tables
- **Fleet** – Vehicle list or grid with status badges; filter by status; edit (icon) and remove only in edit panel
- **Maintenance** – Default view By type; New job; open jobs with priority/status, due date, time in state; edit and remove only in edit panel; expandable history and parts
- **Parts** – Order part; edit and remove only in edit panel; link to maintenance jobs

All data is read from JSON under `src/lib/data/` (no backend). Read-only mockup. Data model supports TPS/TOC-style metrics (planned vs unplanned, component, timestamps, technician assignment) and configuration (parts consumed, vehicle role).

## Production readiness

This app is a mockup/prototype. Additional steps are required to make it production-ready: security requirements, database backup and archive of legacy jobs and sold vehicles, phone apps that scan VINs, and a user-facing status board with a unique URL for tracking an assigned car. See the separate proposal: [docs/PROPOSAL-PRODUCTION-READINESS.md](docs/PROPOSAL-PRODUCTION-READINESS.md).

## Regenerating screenshots

After changing the UI, rebuild and run the screenshot script:

```bash
npm run build
node scripts/screenshots.mjs
```

Screenshots are saved to `docs/` (dashboard, fleet, maintenance, parts, and maintenance-edit for the job workflow doc).
