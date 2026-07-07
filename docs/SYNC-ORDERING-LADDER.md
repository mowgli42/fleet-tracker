# Sync ordering ladder (total order for replay)

This file is the **single precedence ladder** for deterministic event replay and projection in fleet-tracker. It satisfies the engineering review requirement: one written rule for `event_ts_server` vs `causal_version`, with tests in `src/lib/sync/sync.test.ts`.

## When to use it

- **Cloud / owner projection:** Replay accepted events in **total order** before folding into per-vehicle state.
- **Pre-sync / local-only buffers:** Events may have `event_ts_server === null`. Do not infer global wall-clock order across sites from local timestamps alone; once the cloud assigns `event_ts_server`, ordering is defined below.

## Total order (ascending)

Compare two envelopes `a` and `b`:

1. **Primary time:** `event_ts_server ?? event_ts_local` (ISO 8601 string compare).  
   - After cloud accept, `event_ts_server` is always set; this matches “server time wins” for cross-site ordering.
2. **`site_id`** (lexical ascending).  
   - Tie-break when server timestamps collide (same millisecond batch) or when comparing placeholder local times.
3. **`entity_id`** (lexical ascending).  
   - Groups events for the same entity before causal ordering.
4. **`causal_version`** (numeric ascending).  
   - Monotonic per `(site_id, entity_id)` at the site; resolves same-millisecond conflicts for one entity.
5. **`event_id`** (lexical ascending).  
   - Stable final tie-break (UUIDs).

## Conflict policy (design alignment)

- **Cross-entity interleaving:** Determined by primary time, then site, entity, causal, event id. No special “latest wins” merge for unrelated entities beyond this order.
- **Same entity, same server instant:** `causal_version` disambiguates; the site must monotonically increase causal version per entity for new writes.
- **Design doc tie-break (`site_id` lexical):** Applied at step 2 when timestamps tie.

## Implementation

- Function: `compareEventsForTotalOrder` and `sortEventsForReplay` in `src/lib/sync/sortEvents.ts`.
- Do not duplicate this ordering in other modules; import from `sortEvents.ts`.

## Sync ingress (separate concern)

Authorization for `/sync/events` (or the in-browser cloud simulator) is **not** inferred from ordering. Use **site-scoped keys** (`src/lib/sync/siteAuth.ts`): each `site_id` maps to a secret; requests without a valid key for that site are rejected with structured codes in `acceptEventOnCloud`.
