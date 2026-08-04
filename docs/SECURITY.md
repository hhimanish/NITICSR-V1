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

## Tenant Isolation Audit — ERT 11

A follow-up pass specifically confirming what "Tenant Isolation" means in a
single-schema, multi-tenant app like this one: every query that touches
another organization's data must be scoped by `organization_id`, and that
scope must come from somewhere the caller can't forge. All 67 route files
under `app/api/v1/**` were checked for this.

**Pattern found, consistently applied**: every write or resource-scoped
read either (a) derives the owning `organization_id` from the resource row
itself — e.g. `csr-projects/[id]/milestones` looks up the project's
`corporate_org_id` before calling `requirePermission`, rather than trusting
a client-supplied org id — or (b) takes `organizationId` as an explicit path
or query param and passes it straight into `requirePermission`/`can()`,
which independently re-derives whether the caller is actually a member of
*that* organization with the required permission from `organization_members`
— so a client can't widen its own access by passing a different org id; the
DB join simply returns no rows.

**Two deliberately cross-tenant surfaces, working as designed**:
- NGO directory reads (`ngo-profiles`, `ngo-profiles/[id]`) use
  `hasAnyPermission` — access if the caller holds `NGO.Profile.Read`
  *anywhere*, not scoped to one org, because browsing NGOs across the
  platform is the point (ERT 3). Responses are aggregate-only for
  partnership stats (`computeNgoPartnershipStats`), never another
  corporate's specific project details.
- Document/verification review (`ngo-documents/[id]`,
  `verification-requests/[id]`) checks the *reviewer's* organization (the
  auditor/platform_admin's own org, passed as `input.organizationId`) holds
  `NGO.Verify`/`Verification.Review` — not the document's own org — because
  reviewing another organization's submission is inherently cross-tenant.
  This isn't a gap: the resource being modified (a document's status) isn't
  itself organization-scoped data being leaked, and the reviewer's
  permission check is real and independently verified against their actual
  membership.

No IDOR was found in this pass beyond what the Phase 5 review already
covered. `feature_flags` global (platform-wide) writes — new this ERT — are
gated by the separate `Platform.FeatureFlag.Manage` permission
(`app/api/v1/feature-flags/route.ts`), checked via `hasAnyPermission` since
a global write isn't scoped to any single organization by definition; org-
scoped overrides go through the ordinary `Organization.Write` check.

## Developer credentials — ERT 12

`api_keys` and `webhooks` went from dormant schema to real, callable
surfaces this ERT. Handling:

- **API keys**: the raw key is generated with `crypto.randomBytes(24)`,
  shown to the caller exactly once (at creation, in the API response and
  the settings UI), and never stored — only its SHA-256 hash
  (`lib/api-keys.ts`'s `hashApiKey`). Every subsequent request compares a
  hash of the presented key, the same non-reversible pattern Clerk-issued
  session tokens already imply, applied here explicitly. A revoked key
  (`revoked_at` set) is checked on every lookup, not just at issuance.
- **Webhook signing secrets**: unlike API keys, the outbound HMAC
  signature NITICSR computes on every delivery requires the actual
  secret, not a hash of it (hashing is one-way) — so `webhooks.secret` is
  stored in plaintext in the database, a deliberate exception to the
  hash-everything default elsewhere in this file, documented rather than
  silently inconsistent. It's shown to the caller once, same as an API
  key, so they can verify `X-NITICSR-Signature` on their receiving end.
- **IDOR**: the new `/api/v1/organizations/{id}/search` key-auth path
  derives `organizationId` from the API key row itself
  (`lib/api-auth.ts`'s `resolveCaller`), then requires it to match the
  `{id}` path param — a key can't be used to reach a different
  organization's data than the one it was issued to.

## Not done here (see docs/ARCHITECTURE.md roadmap)

Formal OWASP Top 10 penetration testing, load/DoS testing at scale, and
adversarial zero-trust mobile security testing (GPS spoofing, rooted-device
detection) — each needs either a scoped external engagement or a feature
(mobile app) that doesn't exist yet.
