# Phase 1 (shipped in this repo)

Scope matches `docs/OFFICE-HOURS-DESIGN-20260327.md` **Phase 1 (must ship)**:

1. **Single-site local operation during cloud outage** — Maintenance actions append to a durable **local event log** and **outbox** in `localStorage`; toggle **Cloud offline** in the sidebar or on `/sync` to simulate outage. Work continues; queued events flush when cloud is back.
2. **Event outbox + replay + cloud projection** — `acceptEventOnCloud` assigns `event_ts_server`, dedupes by `idempotency_key`. Ordering for replay is documented in `docs/SYNC-ORDERING-LADDER.md`. Site ingress requires a **site key** (`src/lib/sync/siteAuth.ts`).
3. **Owner view (sync page)** — The **Cloud sync** page (`/sync`) includes **Owner availability**: Ready / At-risk / Blocked from the same projection used for the cloud acceptance log (`readinessForFleet`).

## Optional: HTTP cloud (Phase 1 protocol)

By default the “cloud” is still in `localStorage` in the browser (fast for static hosting). To exercise real HTTP sync:

1. Terminal A: `npm run demo:sync-server` (listens on `http://127.0.0.1:8787`, persists to `.demo-cloud/state.json`).
2. Terminal B: `VITE_SYNC_API_URL=http://127.0.0.1:8787 npm run dev` (or set in `.env` and rebuild for `npm run preview`).

The app posts `{ events }` to `POST /api/sync/events` with headers `X-Site-Key` and `X-Site-Id`, then refreshes state with `GET /api/sync/state`. The demo key for `demo-site-1` is `demo-local-key` (see `src/lib/sync/constants.ts`).

## Not in Phase 1

Cross-site transfer, owner-only deploy split, and production auth beyond per-site key are follow-ups. Client exponential backoff for outbox flush is implemented in `src/lib/sync/flushBackoff.ts`. Track broader items in `TODOS.md` and `docs/TEST-PLAN-OFFLINE-SYNC.md`.

**Behavior contract:** OpenSpec change `openspec/changes/add-offline-sync-phase1/` (Gherkin specs + `verification.md`). Run `openspec validate add-offline-sync-phase1 --strict` before archive.
