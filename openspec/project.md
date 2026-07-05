# Fleet Tracker — Project Context

## Purpose

Fleet Tracker is a car fleet management web app (SvelteKit static site) for vehicle status, maintenance jobs, parts orders, and Phase 1 offline-first cloud sync demo. Data is JSON + `localStorage`; optional HTTP sync via demo server.

## Tech Stack

- **SvelteKit 2** + **Svelte 5** + **TypeScript**
- **Tailwind CSS** — industrial/utilitarian UI
- **Vitest** — unit tests (`src/lib/sync/sync.test.ts`)
- **Playwright** — screenshot capture (`scripts/screenshots.mjs`)
- **OpenSpec** — spec-driven changes with Gherkin scenarios (`openspec/`)
- **Beads (`bd`)** — issue tracking (`.beads/`)

## Conventions

- Domain types: `src/lib/types/fleet.ts`
- Seed data: `src/lib/data/*.json`
- Sync modules: `src/lib/sync/` — event log, outbox, cloud accept, `readinessForFleet`
- Routes: `/` dashboard, `/fleet`, `/maintenance`, `/parts`, `/sync`, `/cloud`, `/tablet`
- Readiness (Ready / At-risk / Blocked) MUST only be derived via `projectReadiness.ts`
- Spec changes: OpenSpec proposal → design → Gherkin specs → tasks → implement → `verification.md` → archive

## Phase 1 Demo (offline sync)

Authoritative design: `docs/OFFICE-HOURS-DESIGN-20260327.md`  
OpenSpec contract: `openspec/changes/add-offline-sync-phase1/`  
Test checklist: `docs/TEST-PLAN-OFFLINE-SYNC.md`

## Workflow for AI Assistants

1. Read `openspec/AGENTS.md` and active change folder before implementing features.
2. Use Gherkin scenarios as the behavioral contract; map tests in `verification.md`.
3. Run `openspec validate <change> --strict` and `npm test` before marking tasks complete.
4. Use Beads (`bd ready`) for day-to-day task tracking alongside OpenSpec.

## Out of Scope (Phase 1)

- Cross-site transfer events
- Production auth beyond demo site key
- Full `/cloud` owner projection rewrite
