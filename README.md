# Fleet Tracker

A mockup car fleet management webtool built with SvelteKit and JSON. Tracks vehicle status, open maintenance jobs (with priority and history), and parts on order.

**v2.0** — Redesigned with the frontend-design skill: industrial/utilitarian aesthetic, Sora + DM Sans typography, cohesive palette (teal accent, CSS variables), compact top-anchored layout, staggered reveals, and refined accessibility (focus states, semantics).

## Screenshots

| Dashboard | Fleet |
|-----------|-------|
| [![Dashboard](screenshots/dashboard.png)](screenshots/dashboard.png) | [![Fleet](screenshots/fleet.png)](screenshots/fleet.png) |

| Maintenance | Parts |
|-------------|-------|
| [![Maintenance](screenshots/maintenance.png)](screenshots/maintenance.png) | [![Parts](screenshots/parts.png)](screenshots/parts.png) |

- **Dashboard** — Summary cards, urgent maintenance, and parts on order.
- **Fleet** — Vehicle grid/list with status filter.
- **Maintenance** — Open jobs with expandable history.
- **Parts** — Orders with links to related jobs.

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

- **Dashboard** – Summary cards (vehicles by status, open jobs, parts on order), urgent maintenance list, parts on order list
- **Fleet** – Vehicle list or grid with status badges; filter by status; optional `?status=ready` query
- **Maintenance** – Open jobs with priority and status; expandable row to view job history
- **Parts** – Parts on order with status and link to related maintenance job

All data is read from JSON under `src/lib/data/` (no backend). Read-only mockup.

## Regenerating screenshots

After changing the UI, rebuild and run the screenshot script:

```bash
npm run build
node scripts/screenshots.mjs
```

Screenshots are saved to `screenshots/` (Dashboard, Fleet, Maintenance, Parts).
