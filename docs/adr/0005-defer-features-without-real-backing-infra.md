# ADR 0005: Defer features that would only be mockable, not buildable

**Status:** Accepted — recurring policy applied at every phase

## Context

Each phase's original brief asked for capabilities that depend on
infrastructure, partnerships, or products that don't exist in this
project: escrow (needs a payment processor), zero-trust mobile audit
(needs a mobile app), real MCA21/DARPAN/FCRA verification (none expose
public APIs), load/adversarial security testing (needs a live staging
environment and, for pentesting, a scoped engagement), blue-green
deploys/Redis/CDN (infrastructure decisions not yet made).

## Decision

Build the real, working version of everything that has genuine backing
today. For everything else, don't build a shell that only looks like it
works — document the intended interface/extension point and the specific
blocker in `docs/ARCHITECTURE.md`'s roadmap section instead.

Concretely, this shows up as things like: `verification_checks.result` is
a JSONB field shaped like what a real MCA21 integration would fill in, but
today's verification flow is an honest manual review queue — not a fake
"connected" integration. The AI Copilot only answers from the caller's own
real data with explicit "AI-generated, not verified" labeling, rather than
simulating capabilities (citations to non-existent sources, confidence
scores with no real basis) that would look more impressive but mean
nothing.

## Consequences

- Every phase ships a smaller surface area than its original brief, but
  everything shipped is real and tested (see CI: migrations run against
  an actual Postgres, not mocked).
- The roadmap section of `docs/ARCHITECTURE.md` is the single place
  tracking "asked for, not yet buildable, and why" — check there before
  assuming a described capability (e.g. escrow, offline audit) exists.
- This means the product surface understates the original ambition at any
  given snapshot — intentional; the alternative (shipping impressive-
  looking non-functional UI) is worse for a platform meant to handle real
  compliance and funds.
