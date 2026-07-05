# TODOS

## P1 - Shared Availability Derivation Contract
- **What:** Implement one shared availability-derivation contract/module used by both local site projection and cloud projection.
- **Why:** Prevents local/cloud status drift (Ready/At-risk/Blocked mismatches) and reduces duplicated logic.
- **Pros:** Strong DRY alignment, deterministic behavior, easier parity testing.
- **Cons:** Requires introducing shared contract boundaries and migration from duplicated logic.
- **Context:** Current plan defines canonical state model and arbitration rules, but derivation logic can still be implemented separately in two places unless enforced.
- **Depends on / blocked by:** Depends on final event schema and conflict winner rules being fixed in implementation.

## P2 - Pre-Miss Risk Nudges
- **What:** Add pre-miss nudges with configurable warning windows before vehicles become blocked.
- **Why:** Shifts value from reactive status tracking to preventive maintenance, directly improving owner outcomes.
- **Pros:** Earlier intervention, fewer blocked vehicles, stronger “no missed jobs” story.
- **Cons:** Introduces additional threshold tuning and notification behavior complexity.
- **Context:** Deferred during CEO expansion review to protect first-phase scope; still considered a high-value phase-2 feature.
- **Depends on / blocked by:** Depends on stable SLA escalation lifecycle and explainability reason pipeline.

## P2 - Site Policy Packs
- **What:** Add per-site policy packs for thresholds, SLA defaults, and versioned rollout templates.
- **Why:** Enables multi-site operational differences without forking core logic.
- **Pros:** Better fit for heterogeneous fleets, cleaner scale path for enterprise rollouts.
- **Cons:** Adds configuration surface area and governance/versioning needs.
- **Context:** Deferred during CEO expansion review due to early complexity risk; should be tracked for later rollout phases.
- **Depends on / blocked by:** Depends on baseline global policy model and policy-version conflict handling already defined in plan constraints.

## P2 - DESIGN.md for demo shell (when it diverges)
- **What:** Add a short `DESIGN.md` (or package-local design notes) when the offline-demo shell diverges from `src/app.css` tokens and layout patterns.
- **Why:** Prevents token drift and accidental “second product” styling across cloud, local node, and PWA client.
- **Pros:** Single place for demo-specific spacing, status colors, and motion rules; easier `/design-review` later.
- **Cons:** Another file to maintain; can lag code if not updated with UI changes.
- **Context:** Raised in `/plan-design-review` addendum on 2026-03-27. While the demo reuses fleet-tracker vocabulary, new surfaces may fork.
- **Depends on / blocked by:** First UI land for the demo package; wait until divergence is real, not speculative.

## P2 - Owner empty, error, and partial-sync copy
- **What:** Write and ship strings plus live-region behavior for owner dashboard empty states, projection errors, and partial sync (lag, pending events).
- **Why:** Trust lives in what the owner reads when cloud is unhealthy; silent or generic copy erodes the demo story.
- **Pros:** Matches design addendum state table; fewer “what happened?” moments during outage simulation.
- **Cons:** Copy iteration time; may need product review for tone.
- **Context:** From `/plan-design-review` addendum; pairs with observability (projection lag) in the engineering plan.
- **Depends on / blocked by:** Owner read model and sync health signals available in UI.
