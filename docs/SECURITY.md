# Security Review — Phase 5

A code-level review of every API route (`app/api/**/route.ts`), not a
formal penetration test — see `docs/ARCHITECTURE.md`'s Phase 5 section for
why an adversarial/load-based pentest isn't something this pass could
honestly claim to have done.

## Scope

- SQL injection
- IDOR / broken object-level authorization
- XSS via server-rendered content
- Secret handling
- Abuse / cost-based DoS on paid endpoints
- Timing attacks on secret comparison

## Findings and fixes

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | `/api/match` (public, unauthenticated) and `/api/contact` (public) had no rate limiting, despite `/api/match` calling a paid Cerebras API on every request | Medium (cost/abuse) | **Fixed** — `lib/rate-limit.ts`, per-IP fixed window (10/min match, 5/min contact) |
| 2 | `/api/copilot` (authenticated) also calls a paid API with no per-user limit | Low (cost) | **Fixed** — 20/min per user |
| 3 | `/api/internal/process-jobs` compared the shared secret with `!==`, a non-constant-time comparison | Low (timing side-channel) | **Fixed** — `crypto.timingSafeEqual` in `secretsMatch()` |
| 4 | JSON-LD blocks are injected via `dangerouslySetInnerHTML={{ __html: JSON.stringify(...) }}`, which doesn't escape `</script>` sequences | Informational | **No user input reaches any JSON-LD block today** (all sourced from static content: blog manifest, FAQ array, org info). Flagged so a future page rendering user-generated content (e.g. a public NGO profile) doesn't reuse this pattern without escaping. |

## Verified clean

- **SQL injection**: every dynamic query across `app/api/v1/**` builds
  conditions with parameterized `$n` placeholders; the only string-built
  SQL fragments are column names and `ASC`/`DESC` sort direction, both from
  a fixed whitelist in code — never from a raw request value.
- **IDOR**: resource-scoped routes (`csr-projects/[id]`, `ngo-profile`)
  derive the owning organization from the resource row itself (or the path
  param that *is* the organization), then check permission against that —
  not from a client-supplied "trust me, I own this" field.
- **Secrets**: `CEREBRAS_API_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL` are
  only referenced in server-only modules (`lib/cerebras.ts`, `lib/db.ts`),
  never in a `"use client"` file.
- **Webhook verification**: `/api/webhooks/clerk` rejects any request
  without a valid svix signature before touching the database.
- **Error handling**: `withApiErrors()` (`lib/api-utils.ts`) translates
  unexpected errors to a generic 500 and logs the real error server-side —
  no stack traces or DB error text reach the client.

## Not done here (see docs/ARCHITECTURE.md roadmap)

Formal OWASP Top 10 penetration testing, load/DoS testing at scale, and
adversarial zero-trust mobile security testing (GPS spoofing, rooted-device
detection) — each needs either a scoped external engagement or a feature
(mobile app) that doesn't exist yet.
