## Learned User Preferences

- When README or docs show UI screenshots, keep image paths consistent with where files are committed (e.g. `docs/` vs `screenshots/`) and regenerate screenshots after substantive UI changes.

## Learned Workspace Facts

- fleet-tracker is SvelteKit (Svelte 5) with TypeScript, Tailwind CSS, and `@sveltejs/adapter-static` for a prerendered static site (`npm run build`).
- Fleet domain types live in `src/lib/types/fleet.ts`; seed data is JSON under `src/lib/data/` (vehicles, maintenance jobs, parts orders).
- Primary routes include dashboard (`/`), fleet (`/fleet`), maintenance (`/maintenance`), and parts (`/parts`) with shared app shell navigation.
- README screenshots are captured with Playwright via `scripts/screenshots.mjs` after a build; against `npm run preview`, navigate from `/` using in-app links so CSS loads on subroutes (loading `/fleet` directly can break relative `./_app` assets).
- Tests run with Vitest (`npm run test`).
