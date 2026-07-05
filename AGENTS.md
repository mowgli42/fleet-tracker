## Learned User Preferences

- When README or docs show UI screenshots, keep image paths consistent with where files are committed (e.g. `docs/` vs `screenshots/`) and regenerate screenshots after substantive UI changes.

## OpenSpec + Gherkin + Beads workflow

**Full workflow:** `openspec/WORKFLOW.md`

This project uses [OpenSpec](https://github.com/Fission-AI/OpenSpec) with Gherkin verification and [Beads](https://github.com/steveyegge/beads) for task tracking.

**Before implementing features:**
- Read `openspec/WORKFLOW.md` and relevant `openspec/specs/<capability>/spec.md`
- Run `bd ready` and announce the issue you are taking
- Treat `#### Scenario:` blocks as the behavioral contract; mirror them in `features/*.feature`

**Workflow:** spec → Beads issues → implement → `npm test` + `npm run test:gherkin` → `/opsx:archive`

**Living specs:** `openspec/specs/vehicle/spec.md`  
**Active change (sync):** `add-offline-sync-phase1`

## Learned Workspace Facts

- fleet-tracker is SvelteKit (Svelte 5) with TypeScript, Tailwind CSS, and `@sveltejs/adapter-static` for a prerendered static site (`npm run build`).
- Fleet domain types live in `src/lib/types/fleet.ts`; seed data is JSON under `src/lib/data/` (vehicles, maintenance jobs, parts orders).
- Primary routes include dashboard (`/`), fleet (`/fleet`), maintenance (`/maintenance`), and parts (`/parts`) with shared app shell navigation.
- README screenshots are captured with Playwright via `scripts/screenshots.mjs` after a build; against `npm run preview`, navigate from `/` using in-app links so CSS loads on subroutes (loading `/fleet` directly can break relative `./_app` assets).
- Tests run with Vitest (`npm run test`).

## Issue Tracking

This project uses **bd (beads)** for issue tracking. Run `bd prime` for workflow context, or install hooks with `bd hooks install` for automatic context injection.

Quick reference:

- `bd ready` - find unblocked work
- `bd create "Title" --type task --priority 2` - create an issue
- `bd close <id>` - close completed work
- `bd dolt push` - push Beads data when using a shared Beads remote

For full workflow details, run `bd prime`.
