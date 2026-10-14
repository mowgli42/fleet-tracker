# fleet-tracker

Mockup car fleet management webtool (SvelteKit + JSON seed). Tracks vehicle status, open maintenance jobs, and parts on order. Static site with optional Vercel demo mode (localStorage + daily reset).
Stack: SvelteKit (Svelte 5) + TypeScript + Tailwind + adapter-static. Data: JSON under `src/lib/data/`.
Posture: ponytail (repo >30 days).
Shared health pack lives in `.cursor/skills/` and `.cursor/rules/` — follow those for [Health] work.

## Commands

- Dev: `npm install && npm run dev` (http://localhost:5173)
- Test: `npm test` (Vitest) and `npm run test:gherkin`
- Build / preview: `npm run build && npm run preview`
- Demo mode: `VITE_DEMO_MODE=true npm run build && VITE_DEMO_MODE=true npm run preview`
- Screenshots: `npm run build && node scripts/screenshots.mjs` (after UI changes; commit under `docs/`)
- Secrets: `bash scripts/scan-secrets.sh .`
- Beads: `bd ready` / `bd prime`

## Hard prohibitions

- Do not commit private keys, `*-key.pem`, `*.key`, `.env` secrets, or `BEGIN … PRIVATE KEY` blobs. Generate credentials locally; gitignore them. Public certs may stay.
- Do not treat the static JSON mockup as production data store. Do this instead: keep seed in `src/lib/data/` and track durable local-db / sync as remaining work in OpenSpec + Beads.
- Do not invent routes, env vars (`VITE_*`), or API endpoints not present in the tree or `vercel.json`.
- Do not rewrite OpenSpec / Gherkin / Beads to match hoped-for future. Update them only when code already changed. Active change: `openspec/changes/add-offline-sync-phase1/`.

## Verify by change type

| Change | Check |
| --- | --- |
| UI / Svelte | `npm run dev` then navigate dashboard `/`, fleet `/fleet`, maintenance `/maintenance`, parts `/parts` |
| Spec | matching `features/*.feature` + OpenSpec capability still true; `npm run test:gherkin` |
| Deploy | production deploy READY; primary flow (dashboard summary cards) loads |
| Secrets / TLS | `bash scripts/scan-secrets.sh .` passes |
| Screenshots | regenerate via `scripts/screenshots.mjs` and confirm paths in README |

## Source of truth

- Behavior: OpenSpec (`openspec/specs/vehicle/spec.md`) + `features/*.feature`
- Remaining work: Beads (`.beads/`) + GitHub issues
- Demo evidence: README screenshots under `docs/`, `docs/JOB-WORKFLOW.md`
- Health bar: do not duplicate `SUCCESS_CRITERIA.md` here

## House vocabulary

- Vehicle status / readiness — dashboard metrics (fleet %, unplanned %, MTTR, PM compliance). Do not write "availability score" generically.
- Maintenance job — open jobs with priority, status, due date, time in state; history expandable. Do not write "ticket" or "work order".
- Parts on order — linked to jobs; status badges. Do not invent inventory levels beyond seed JSON.
- Demo mode — `VITE_DEMO_MODE=true` + localStorage daily reset. Do not assume shared server state.
- Offline sync Phase 1 — outbox / sync-worker / ingress as specified in `openspec/changes/add-offline-sync-phase1/`.

## Good / bad (from this repo)

Bad: loading `/fleet` directly in preview (breaks relative `./_app` assets).
Good: navigate from `/` using in-app links so CSS loads; regenerate screenshots after UI changes.

## Borrowed patterns

- hard-prohibition from anomalyco/opencode via ossrules.md — fits secrets and no-aspirational-spec rules
- verification-matrix from anomalyco/opentui via ossrules.md — fits change-type checks for UI/spec/deploy
- single-source from various via ossrules.md — points at OpenSpec/Gherkin/Beads instead of duplicating
- house-vocabulary from portfolio pattern — fleet/maintenance/parts terms specific to this mockup
