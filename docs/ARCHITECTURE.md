# NITICSR OS — Phase 2 Architecture

Phase 2 builds the enterprise backend foundation Phase 3's Corporate/NGO/Auditor
portals will run on: a multi-tenant Postgres schema, permission-based RBAC,
core NGO/CSR data model, versioned REST APIs, a notification service, and a
DB-backed background job queue.

It deliberately **does not** build several things from the original Phase 2
brief — see [Deferred to roadmap](#deferred-to-roadmap) for why.

## System architecture

```mermaid
flowchart TB
    subgraph Client
        Web[Next.js App Router<br/>marketing + corporate/ngo portals]
    end

    subgraph "Next.js app (single Render web service)"
        MW[Clerk middleware<br/>route protection]
        API["/api/v1/* route handlers<br/>Zod validation + RBAC"]
        Internal["/api/internal/process-jobs<br/>shared-secret protected"]
        Webhook["/api/webhooks/clerk<br/>svix-verified"]
    end

    subgraph External
        Clerk[Clerk<br/>identity/session]
        Cerebras[Cerebras API<br/>gpt-oss-20b]
        Resend[Resend<br/>email]
        GH[GitHub Actions<br/>scheduled workflow]
    end

    subgraph Data
        PG[(Render Postgres<br/>multi-tenant schema)]
    end

    Web --> MW --> API
    Web -.session.-> Clerk
    Clerk -- user.created/updated/deleted --> Webhook --> PG
    API --> PG
    API --> Cerebras
    API -- queueNotification --> PG
    GH -- cron: every 15 min --> Internal --> PG
    Internal --> Resend
```

## Entity-relationship diagram

```mermaid
erDiagram
    organizations ||--o{ organization_members : has
    users ||--o{ organization_members : belongs_to
    roles ||--o{ organization_members : assigned_as
    roles ||--o{ role_permissions : grants
    permissions ||--o{ role_permissions : granted_by

    organizations ||--o| ngo_profiles : "is an NGO"
    ngo_profiles ||--o{ ngo_documents : has
    ngo_profiles ||--o{ ngo_certifications : has
    ngo_profiles ||--o| ngo_trust_scores : has
    ngo_profiles ||--o{ ngo_cause_areas : tagged_with
    csr_categories ||--o{ ngo_cause_areas : "is a"

    organizations ||--o{ csr_projects : funds
    ngo_profiles ||--o{ csr_projects : implements
    csr_categories ||--o{ csr_projects : categorized_as
    csr_projects ||--o{ project_locations : located_at
    csr_projects ||--o{ project_sdgs : maps_to
    sdgs ||--o{ project_sdgs : "is a"
    csr_projects ||--o{ beneficiaries : reaches
    csr_projects ||--o{ milestones : tracked_by

    ngo_profiles ||--o{ verification_requests : requests
    verification_requests ||--o{ verification_checks : includes

    users ||--o{ notifications : receives
    jobs ||--o{ notifications : delivers
```

## Permission model

Authorization is **permission-based**, not role-hardcoded: call sites check
capabilities like `CSR.Project.Write`, never `if (role === 'admin')`. This
means adding a role or changing what an existing role can do is a data change
(`role_permissions` seed rows), not a code change. See [lib/rbac.ts](../lib/rbac.ts)
and the seed data in
[db/migrations/002_core_org_auth_rbac.sql](../db/migrations/002_core_org_auth_rbac.sql).

Identity is owned by Clerk; the `users` table is a local mirror kept in sync
via the Clerk webhook so we have a stable FK target for ownership and RBAC
joins without depending on Clerk for every query.

## Running migrations

```bash
# DATABASE_URL must point at your Postgres instance
npm run db:migrate
```

Migrations are plain numbered `.sql` files in `db/migrations/`, applied in
order and tracked in a `_migrations` table (see `scripts/migrate.mjs`). No
ORM — the schema is simple enough that hand-written SQL stays readable, and
it avoids a dependency whose query builder would otherwise shape the whole
data layer.

## Adding a new v1 API route

1. Add/extend a Zod schema in `lib/schemas-v1.ts`.
2. Write the route handler under `app/api/v1/...`, wrapped in `withApiErrors`
   (translates Zod/RBAC errors to consistent JSON responses).
3. Call `requirePermission(userId, organizationId, "Some.Permission")` before
   any read/write — this is also what enforces tenant isolation, since the
   underlying query only matches rows for that user *and* that organization.
4. Add the endpoint to `docs/openapi.yaml`.

## Background jobs & notifications

There is no standalone worker process — Render's web service only serves
HTTP. Jobs are rows in a Postgres `jobs` table (see `lib/jobs.ts`), and
`.github/workflows/process-jobs.yml` calls `POST /api/internal/process-jobs`
(protected by `INTERNAL_JOB_SECRET`) on a 15-minute GitHub Actions cron —
free, and no new infrastructure to provision. This is why Redis isn't used
for queuing: at Phase 2 volume, a polling table is simpler and sufficient.

Notifications currently only have a real `email` provider (via Resend,
reused from the Phase 1 contact form). SMS/WhatsApp/push/Slack/Teams/webhook
are modeled in the schema (`notifications.channel`) so the data layer is
ready, but are not wired to a real send path — see the comment in
`lib/notifications.ts`.

## Analytics & consent

`lib/analytics.ts` provides a `trackEvent()` call sites can use today (wired
into the contact form and matchmaking demo submits), plus a consent banner
(`components/site/consent-banner.tsx`) that gates it. No analytics provider
is connected — none has been chosen — so `trackEvent()` is a logged no-op in
development and silent in production. Wiring a real provider (Plausible,
PostHog, GA4) later means editing the one function in `lib/analytics.ts`,
not every call site.

## Deferred to roadmap

These were in the original Phase 2 brief but depend on infrastructure or
partnerships that don't exist yet in this project. Building them now would
mean elaborate mocks standing in for things with no real backing — exactly
the kind of half-finished implementation worth avoiding. They're documented
here as the intended extension points, not abandoned:

- **Escrow engine** — needs a real payment processor / banking partner.
  `csr_projects`/`milestones` already model the project structure an escrow
  ledger would hang off of.
- **Zero-Trust Audit Engine** (GPS validation, EXIF, device attestation,
  camera lock, offline sync) — fundamentally needs a mobile app capturing
  that data at the point of audit. No mobile app exists in this project yet.
- **Real verification integrations** (MCA21, DARPAN, Income Tax, GST, FCRA)
  — none of these expose public self-serve APIs; real integration needs a
  data-sharing agreement or compliant verification vendor.
  `verification_checks` already models the interface (`provider`, `status`,
  `result`, `expires_at`) a real integration would fill in.
- **PostGIS geospatial queries** (polygon search, heatmaps) — plain-Haversine
  radius search over `latitude`/`longitude` is now real (`csr_projects` and
  `ngo_profiles` both support `lat`/`lng`/`radiusKm`); a PostGIS `geometry`
  column is only worth adding once polygon queries or heatmap aggregation
  are actually needed.
- **pgvector semantic search / embeddings / AI risk scoring** — needs real
  usage data to be meaningful; premature before there's a corpus to embed.
- **Redis-backed caching** — not provisioned; revisit if the Postgres-backed
  approach actually becomes a bottleneck.
- **Full event bus** (pub/sub across services) — there's one Next.js app
  today, not multiple services that need decoupling. `audit_logs` and the
  `jobs` table cover the append-only trail and async-processing needs that
  exist right now.

## Phase 4: real workspaces, not just dashboards

Corporate, NGO, and Auditor workspaces (`app/(corporate)`, `app/(ngo)`,
`app/(auditor)`) are wired to live `/api/v1` data — not placeholder KPI
tiles. `components/dashboard/org-context.tsx` resolves (or creates) the
signed-in user's organization of the workspace's type and provides it via
context, so every page underneath just calls `useOrg()` rather than
re-implementing onboarding. `components/dashboard/copilot-panel.tsx` exposes
a real Cerebras-backed AI Copilot (`/api/copilot`) grounded only in the
caller's own organization's records — no cross-tenant data ever enters the
prompt, and the model is instructed to say so rather than guess when the
data doesn't answer the question.

The original Phase 4 brief asked for a much larger surface — a full
"Enterprise Digital Operating Layer" with Executive Command Center, Board/
ESG/Finance/Legal/Consultant/Government workspaces, a configurable workflow
engine, and an offline-capable auditor mobile PWA with device attestation.
That's deferred for the same reason as the Phase 2 items above — building
shallow versions of all of it now would mean UI with no real data or
workflow logic behind it:

- **Government/Board/ESG/Finance/Legal/Consultant workspaces as separate
  surfaces** — the underlying data (SDG mapping, CSR categories, verification
  status) already exists and is queryable via `/api/v1`; these are read-only
  views over the same tables, best built once there's a specific stakeholder
  asking for one, not speculatively.
- **Offline auditor PWA** (GPS geofencing, camera-only capture, perceptual
  hash duplicate detection, offline sync) — same blocker as the Zero-Trust
  Audit Engine above: needs a real mobile app / service-worker + camera
  pipeline that doesn't exist yet. The Auditor Workspace built here is a
  real, functional desktop review queue instead.
- **Configurable workflow engine** (conditional routing, SLA timers,
  escalation chains) — legitimate as its own subsystem once there are enough
  distinct approval flows to justify generalizing beyond the direct
  `status` transitions already implemented on `csr_projects` and
  `verification_requests`.
- **MFA, ABAC, distributed tracing, secrets management** — MFA is a Clerk
  dashboard toggle away when wanted; ABAC/tracing/secrets-management each
  need a tooling decision (which APM? which secrets manager?) not made yet,
  and are premature before there's a security team or real user volume.
- **Command palette, Gantt/Kanban/calendar views** — no concrete page needs
  them yet; see `docs/DESIGN_SYSTEM.md`.

## Phase 5: production readiness — what's real vs. what's certified

The original Phase 5 brief asked for a full enterprise certification
program: load testing at up to 10,000 concurrent users, adversarial
zero-trust penetration testing, mutation testing, blue-green/canary
deploys, and E2E journeys for features (KYC, escrow release, OCR, PDF
board-pack export) that don't exist. That's a QA/SRE/security team's
ongoing program against live infrastructure, not something buildable in a
session — see ADR 0005 for the general policy this follows.

What shipped instead, real and verified:

- **Security**: a code-level review of every API route (`docs/SECURITY.md`)
  — not a formal pentest, but real findings (missing rate limiting on two
  paid, unauthenticated AI endpoints; a non-constant-time secret comparison)
  with real fixes (`lib/rate-limit.ts`, `crypto.timingSafeEqual`).
- **Testing**: `lib/rate-limit.test.ts`, `lib/api-utils.test.ts`, and
  `lib/geo-search.test.ts` (a real integration test against Postgres
  verifying the Haversine radius search actually includes/excludes/orders
  correctly) — measured coverage additions, not a claimed percentage.
- **CI**: `npm audit --audit-level=critical` now runs on every push
  (blocks only on critical severity — see the policy note in `ci.yml` for
  why high/moderate transitive advisories in Next's own dependency tree
  aren't currently blocking).
- **Performance & accessibility**: a real Lighthouse run against the
  production build, documented in `docs/PERFORMANCE.md` with actual scores
  (not asserted targets) — this caught and fixed a genuine accessibility
  bug (unlabeled `Select` triggers, invisible to screen readers) that
  automated CI couldn't have caught on its own.
- **AI governance**: explicit "AI-generated, not verified" labeling on
  both AI surfaces (Copilot, matchmaking demo), model-version logging into
  the existing `audit_logs` table for every Copilot answer.
- **Documentation**: `docs/DEPLOYMENT.md`, `docs/RUNBOOK.md`, and
  `docs/adr/` (5 ADRs covering the real architectural decisions made across
  every phase) — accurate because they describe decisions actually made,
  not a template filled in speculatively.

Deferred, same reasoning as every phase above: load/scale testing (needs a
live staging environment and a reason to spend money simulating traffic
that doesn't exist yet), adversarial zero-trust mobile testing (no mobile
app to attack), mutation testing (marginal value at this codebase's size),
blue-green/canary deploys and Redis/CDN/autoscaling validation (Render's
tier and current traffic don't call for it yet), and a formal OWASP
penetration test (needs a scoped external engagement, not a code review).

## Phase 6: domain map and platform completion

The Phase 6 brief asked for a formal domain-driven re-architecture (17
bounded contexts, each with its own APIs/events/data), a visual business
rules engine, a workflow orchestration engine, a knowledge graph, and
multi-tenant white-labeling with custom domains. None of that was built —
see ADR 0005. A mechanical re-architecture of a single app with ~15 tables
into 17 "services" would add indirection without adding capability; a
generic rules/workflow engine is worth building once there are enough
concrete rules to justify generalizing (right now there's exactly the ad
hoc logic already in the Corporate Compliance page and the `status`
transitions on `csr_projects`/`verification_requests`).

What Phase 6 actually is: the domain map the code already has (proving the
"bounded context" thinking was already present, just not formalized into
separate services), plus finishing four things Phase 2-5 left as unused
schema or missing pieces rather than adding new speculative architecture.

### Domain map (already true today, not aspirational)

| Bounded context (brief's language) | What owns it today |
|---|---|
| Identity & Access | Clerk (identity) + `lib/rbac.ts` (authorization) + `users`/`organization_members` |
| Organization Management | `organizations` table + `/api/v1/organizations` |
| Corporate CSR / NGO Lifecycle | `ngo_profiles`, `/api/v1/organizations/:id/ngo-profile`, `/api/v1/ngo-profiles` |
| Project Portfolio | `csr_projects`, `project_locations`, `project_sdgs`, `beneficiaries`, `milestones`, `/api/v1/csr-projects/**` |
| Audit & Assurance | `verification_requests`/`verification_checks`, the Auditor Workspace review queue |
| Compliance | `csr_categories` (Schedule VII), the Corporate Compliance page's gap checks |
| Documents | `ngo_documents` (schema only — no upload pipeline yet, see below) |
| Notifications | `lib/notifications.ts` + `notifications` table |
| AI Services | `lib/cerebras.ts`, `/api/match`, `/api/copilot` |
| GIS | `lib/rate-limit.ts`'s neighbor, the Haversine radius search in `csr-projects`/`ngo-profiles` routes |
| Reporting/Analytics | Corporate dashboard KPIs, Executive Analytics preview (still illustrative on the public site) |
| Integration Hub | `docs/openapi.yaml` (the interface); no external adapters yet |
| Administration | `feature_flags` (now wired, see below), `audit_logs` |
| Scheduler | `lib/jobs.ts` + the GitHub Actions cron |
| Configuration/Feature Flags | `lib/feature-flags.ts` (new this phase) |

### Completed this phase (finishing existing schema, not new scope)

- **Digital twin fields surfaced**: `project_sdgs`, `project_locations`,
  and `beneficiaries` existed since Phase 2's schema but had no API or UI.
  `GET /api/v1/csr-projects/:id` now returns them; `PUT .../sdgs`,
  `POST .../locations`, and `POST .../beneficiaries` manage them; the
  Corporate project detail page has a compact SDG toggle picker and
  location/beneficiary add forms.
- **Feature flags, for real**: `feature_flags` existed since Phase 2 with
  zero code reading it. `lib/feature-flags.ts` + a seeded `ai_copilot`
  flag now actually gates the Copilot panel — a real usage, not a stub.
- **Health check**: `GET /api/health` checks Postgres connectivity
  specifically; `render.yaml`'s `healthCheckPath` now points at it instead
  of `/`, so a DB outage is caught before Render routes traffic to a
  broken deploy.
- **SEO completion**: fixed a real bug — the root layout set a blanket
  `alternates.canonical: "/"`, which (since Next.js metadata merges
  shallowly per key) every other page silently inherited, telling
  crawlers every single page was a duplicate of the homepage. Removed;
  blog posts and case studies now set their own correct canonical.
  Added site-wide Twitter Card metadata (previously only Open Graph was
  set) and breadcrumbs to every remaining marketing page that lacked them.

### Deferred, same policy as every phase above

- **Domain-driven microservice refactor / event bus** — one app, no team
  boundaries to enforce; the domain map above shows the separation already
  exists logically without the operational cost of real service boundaries.
- **Business rules engine / workflow orchestration engine** — generalize
  once there are 5+ concrete rules needing it, not before.
- **Knowledge graph / pgvector semantic search** — still needs a real
  content corpus (same blocker as Phase 2).
- **Multi-tenant white-label, custom domains, OAuth2/OIDC server, SDKs** —
  no current customer or third-party integrator has asked for any of these.
- **ERP/HRMS/CRM/payment/BI integration adapters** — no partner accounts.
- **Document management (OCR, digital signatures, duplicate detection)** —
  there is no file upload pipeline at all yet (`ngo_documents.file_url` is
  just a text field); building document *management* before document
  *upload* exists is backwards.
- **Unified SMS/WhatsApp/push messaging, mobile offline** — same blockers
  as Phase 2/4 (no provider accounts, no mobile app).

## ERT 1: Governance OS — what's real vs. what needs a real board

The brief asked for a full board-governance/GRC platform: 24 aggregates
(Board, Board Member, Committee, Meeting, Agenda, Resolution, Vote,
Approval Workflow, Escalation, SLA, ...), a visual drag-and-drop workflow
builder, a no-code business rules engine, digital board packs with PDF
export, meeting management, MFA/SAML/OIDC SSO, ABAC, digital signatures.

Most of this was deferred, for a sharper reason than "too big" (see
ADR 0005): modeling Board/Committee/Meeting/Voting mechanics for a board
that doesn't exist isn't a scoped-down version of the real thing, it's a
guess at parliamentary procedure with no real body to design against —
worse than not building it, because it risks locking in the wrong shape
for how an actual board runs (quorum rules, proxy voting, resolution
numbering conventions all vary by company and would need to be reverse-
engineered from a real one). Same logic for the workflow builder and
rules engine (Phase 6 already deferred these — still no concrete backlog
of rules/workflows to generalize from) and for MFA/SAML/OIDC/ABAC/digital
signatures (no enterprise customer's IdP or compliance mandate to build
against yet).

What ERT 1 actually built: the governance primitives that *do* have real
backing today — every approval action already in the system (project
approval, verification approval/rejection) — wrapped with an audit trail,
delegation, and policy management, plus surfacing the resulting signals
on dashboards.

### Completed this ERT

- **Immutable governance decision log**: `governance_decisions`
  (append-only, no update/delete path) records who decided what and why.
  `lib/governance.ts`'s `recordDecision()` is called from the existing
  CSR project approval and verification request approve/reject handlers —
  it wraps real decisions already happening, not a new decision type.
  `GET /api/v1/governance/decisions` (requires `Governance.Decision.Read`)
  exposes the log.
- **Time-bounded delegation of authority**: `delegations` table + `can()`
  in `lib/rbac.ts` now falls back to an active (unrevoked, in-window)
  delegation when a direct role-permission check fails. A delegator can
  only delegate a permission they themselves hold (checked server-side
  before insert, so delegation can't be used to escalate privilege), and
  only to a fellow org member. `POST/GET /api/v1/delegations`,
  `PATCH /api/v1/delegations/:id` to revoke. This is built entirely on
  the existing RBAC model (ADR 0004) — no new authorization system.
- **Versioned policy repository**: `governance_policies` (draft → active
  → superseded → retired, version auto-increments on content edits) +
  `policy_acknowledgements` for read-receipts. Full CRUD under
  `/api/v1/governance/policies` plus an acknowledge endpoint. This is the
  real, buildable slice of "policy management" from the brief — a
  document with versions and read-receipts, not a rules engine.
  `lib/cerebras.ts`'s AI Copilot now cites active policies by title when
  asked policy questions, an incremental extension of the existing
  org-scoped Copilot rather than a new "Governance Copilot" surface.
- **Overdue/SLA signal on existing approvals**: rather than a generic SLA
  engine, a fixed threshold (14 days for CSR project proposals, 7 days for
  verification requests) surfaces an "Overdue" badge on the Corporate and
  Auditor dashboards, computed client-side from data already fetched — no
  new schema.
- **Governance dashboard**: Corporate dashboard gained "Overdue proposals"
  and "Decisions (30d)" KPI tiles and a `/corporate/governance` page
  (policies, delegations, decision log) — all reading real data, none of
  it illustrative.
- **Dark mode toggle**: `.dark` CSS tokens existed since Phase 1 but had
  no UI control. Added a no-flash inline script in `app/layout.tsx` and
  `components/site/theme-toggle.tsx`, wired into both the public site
  header and the dashboard shell.

### Deferred, same policy as every phase above

- **Board/Board Member/Committee/Meeting/Agenda/Resolution/Vote
  aggregates** — no real board to design the mechanics against; see
  above.
- **Visual workflow builder / business rules engine** — still no
  concrete backlog of rules to generalize from (Phase 6 deferral stands).
- **Digital board packs with PDF export, governance calendar, enterprise
  search** — downstream of the board/meeting domain that was deferred.
- **MFA/SAML/OIDC SSO, ABAC, digital signatures** — no enterprise
  customer's identity provider or compliance mandate to build against.
- **Unified Teams/Slack/SMS notifications** — same provider-account
  blocker as Phase 2/4/6.

## ERT 2: Compliance & Regulatory Operations — a platform capability, not a module

The brief's key architectural instruction was right and is the one thing
this ERT actually organized around: compliance should permeate every
capability rather than live in its own module. Concretely, that means
every CSR project now carries a live compliance score and obligation set
computed from data that already exists (SDGs, locations, beneficiaries,
the governance decision log, NGO assignment) — surfaced on the project
detail page, the Corporate dashboard, the Compliance workspace, and the
AI Copilot, all reading the same underlying computation
(`lib/compliance.ts`'s `computeOrgComplianceSummary`), not four separate
implementations of "are we compliant."

The rest of the brief — a monorepo split into `apps/{web,api,mobile,docs,admin}`
+ `packages/*` with Terraform/Kubernetes, a Regulatory Knowledge Graph, a
configurable workflow/rules engine, an evidence vault with OCR and
digital signatures, MFA/SAML/OIDC/ABAC, SOC 2/ISO 27001 readiness — was
deferred for the same reason ADR 0005 has held since Phase 6: none of it
is a scoped-down version of something real, each depends on
infrastructure, a data corpus, or a vendor relationship that doesn't
exist yet (see the itemized list below).

### Completed this ERT

- **Compliance obligation register**: `compliance_obligations`
  (`db/migrations/012_compliance.sql`) — four standard obligations
  (Schedule VII classification, utilization reporting, CSR-2 filing,
  impact documentation) auto-created via `generateObligationsForProject`
  the moment a project is approved (wired into the same PATCH handler
  that already calls `recordDecision`, from ERT 1). Closing one requires
  an explicit human act — `PATCH /api/v1/compliance-obligations/:id` —
  not an automatic status flip, because "filed" is a real-world fact the
  platform can't observe on its own.
- **Deterministic compliance-gap checks**: `getProjectComplianceChecks`
  in `lib/compliance.ts` — five concrete, severity-weighted checks (NGO
  assigned, approval logged, SDG/Schedule VII alignment recorded,
  location recorded, beneficiary data recorded) computed on read from
  data the platform already collects. This is the real version of the
  brief's "AI should detect missing statutory information" — built as
  deterministic checks rather than a model guessing at a status.
- **Blended compliance score**: `getComplianceScore` weights the checks
  above and open obligations into one 0-100 number per project, and
  `computeOrgComplianceSummary` averages it across an organization's
  active projects — the real version of the brief's "Enterprise
  Compliance Score," grounded in the checks above rather than a
  fabricated index.
- **Surfaced everywhere, not a separate page**: a "Compliance score" KPI
  tile on the Corporate dashboard, a compliance checklist + obligations
  panel on every project detail page, a rebuilt `/corporate/compliance`
  workspace (org-wide summary + per-project drill-down with
  mark-filed/waive actions), and the AI Copilot's context now includes
  the same compliance summary so it can answer "are we compliant"
  questions grounded in real figures instead of guessing.

### Deferred, same policy as every phase above

- **Monorepo split into `apps/{web,api,mobile,docs,admin}` +
  `packages/*` with Terraform/Kubernetes** — a full re-platform onto
  microservices with a cluster to operate; no ops team or scaling need
  justifies it (identical to the Phase 6 domain-driven-refactor
  deferral, same ADR 0005).
- **Regulatory Knowledge Graph** (Acts/Sections/Circulars/judicial
  precedents linked semantically) — there's no ingested corpus of
  regulatory text anywhere in the system; a graph with nothing in it
  isn't a capability.
- **Configurable workflow engine / declarative business rules engine**
  (decision tables, simulation, versioning, dynamic approver
  resolution) — still no backlog of 5+ concrete rules beyond what the
  deterministic checks above already cover (Phase 6 / ERT 1 deferral
  stands).
- **Evidence vault** (OCR, digital signatures, hash verification,
  retention/duplicate detection) — `ngo_documents.file_url` is still a
  bare text field; there is no file upload pipeline at all. Building an
  evidence vault before files can be uploaded is backwards, and adding
  real storage means picking a vendor (S3/R2/Render disk) — a decision
  for the product owner, not one to make silently mid-build.
- **MFA/SAML/OIDC SSO, ABAC, SOC 2/ISO 27001 readiness** — no enterprise
  customer's identity provider or auditor engagement to build against.
- **Mobile app, multi-agent AI orchestration** — no mobile app exists;
  no concrete multi-agent use case beyond the single-agent Copilot
  already shipped.
- **17 separate pre-implementation deliverable documents** (capability
  map, event-driven architecture spec, observability plan, etc.) —
  folded into this section plus the code comments in
  `db/migrations/012_compliance.sql` and `lib/compliance.ts`, matching
  how every prior phase was documented, rather than producing a stack of
  RFC-style documents nothing will read.

## ERT 3: NGO Intelligence — real signals only, nothing fabricated

The brief asked for a "Bloomberg Terminal for India's Social Sector":
16 weighted trust dimensions, an NGO Health Index, Governance
Intelligence (board diversity, tenure, conflicts of interest),
Financial Intelligence (revenue trends, cash runway), a Fraud
Intelligence Engine (image-reuse detection, GPS anomalies, invoice
irregularities), AI Impact Prediction, and a Relationship Graph.

This is the one ERT where the right call wasn't just "defer the
unbuildable parts" — it was refusing to build several of them as
literally specified, because doing so would be actively harmful. The
platform's stated purpose is helping a Fortune 500 decide whether an
NGO can be trusted with ₹500 crore. There is no financial statement,
board roster, HR record, photo, invoice, or GPS log anywhere in this
system for any NGO — `verification_checks` is explicitly documented as
a stub interface (no MCA21/DARPAN/Income-Tax/GST/FCRA integration
exists; none expose public self-serve APIs). A "96/100 Trust Score" or
a fraud-risk score computed from none of that isn't a scoped-down
version of trust intelligence, it's a fabricated number that looks like
real due diligence — and on a platform used to size a ₹500 crore
decision, a confident-looking fake number is worse than an honest
blank. That ruled out Governance Intelligence, Financial Intelligence,
Fraud Intelligence, Impact Prediction, and the single blended Health
Index as specified.

### Completed this ERT

- **Finished dormant schema honestly**: `ngo_trust_scores` has existed
  unused since Phase 2 (`db/migrations/004_ngo.sql`), with five score
  components (verification, financial, governance, audit, project
  success). `lib/ngo-intelligence.ts` now computes exactly the two of
  five that have a real data source — `verification_component` (document
  verification completeness + per-provider `verification_checks` pass
  rate) and `project_success_component` (completed vs. cancelled project
  ratio) — and leaves financial/governance/audit `NULL`, never
  fabricated. The blended `score` only averages components that exist;
  an NGO with neither real signal yet gets no row at all (`null`, not a
  misleading zero), and any stale row is cleared if the signals
  disappear.
- **NGO documents, finally with a CRUD surface**: `ngo_documents` existed
  since Phase 2 with no API. `POST/GET
  /api/v1/organizations/:id/ngo-profile/documents` lets an NGO record a
  document (type + optional external link, same `evidence_url`-as-text
  pattern already used by `milestones` — not a new "evidence vault",
  just finishing existing schema). `PATCH /api/v1/ngo-documents/:id`
  lets an auditor verify or reject one, mirroring the existing
  verification-requests review pattern; the Auditor workspace now shows
  pending documents inline in the review queue.
- **NGO 360**: `GET /api/v1/ngo-profiles/:id` and a new
  `/corporate/discovery/:id` page — identity, documents with expiry,
  the real per-provider verification breakdown, operating footprint, and
  the honest trust score with its component breakdown (the existing
  `TrustScoreWidget`/`VerificationBadge` design-system components, built
  in Phase 2 but only ever fed illustrative marketing data until now,
  render real numbers for the first time).
- **Partnership history, aggregated only**: rather than exposing another
  corporate's specific project titles or budgets to a viewing corporate
  (a real cross-tenant data leak risk the brief's "Relationship Graph"
  would have created), `computeNgoPartnershipStats` returns only totals —
  partner count, project count by status, total funding — for the NGO
  being viewed.
- **AI Copilot NGO due-diligence signal**: a Corporate's Copilot context
  now includes which of *that corporate's own* NGO partners have a
  verified document expiring within 60 days — real, own-org-scoped data
  the corporate is already entitled to see via its existing
  partnerships, explicitly not a cross-tenant trust or risk score.

### Deferred, same policy as every phase above

- **Governance Intelligence** (board diversity, tenure, conflicts of
  interest, political exposure) — no NGO board/leadership data model
  exists, identical reasoning to ERT 1 declining the corporate
  Board/Committee domain.
- **Financial Intelligence** (revenue/expense trends, cash runway,
  budget forecasting) — NGOs submit no financial statements to the
  platform; there's no source.
- **Fraud Intelligence Engine** (image-reuse/pHash, GPS anomalies,
  invoice irregularities, synthetic identities) — no photos, invoices,
  GPS logs, or vendor records are captured anywhere.
- **Impact Intelligence / AI Impact Prediction** (lives improved, income
  increase, healthcare outcomes) — no outcome-tracking data beyond the
  beneficiary count-estimates already in the system.
- **NGO Relationship/Knowledge Graph, pgvector/RAG enterprise search** —
  the recurring blocker since Phase 2: no ingested corpus.
- **PostGIS heatmap layers** (disaster zones, aspirational districts,
  tribal regions) — ADR 0002 stands, and those layers need external
  government datasets not integrated anywhere.
- **NGO Capacity Intelligence** (HR/procurement/M&E/tech maturity
  scoring + AI-generated roadmaps) — no underlying data for any
  dimension.
- **Four role-aware AI copilots, SCIM, GraphQL gateway, enterprise API
  catalog with versioning/rate limits** — one real Copilot exists;
  forking it into personas without new data per persona is UI theater.
  No enterprise customer has asked for SCIM or GraphQL.
- **Bespoke mobile experience, offline saved views** — no mobile app
  exists.

## ERT 4: Grant Management OS — the lifecycle extended, not replaced

The brief asked for a 12-stage grant lifecycle (Idea → Proposal → Review
→ Scoring → Approval → Contract → Escrow → Milestones → Monitoring →
Completion → Closure → Renewal). Rather than a new "Grant" domain, this
extends `csr_projects` — which already covers Idea/Proposal (`status`),
Approval (`CSR.Project.Approve`), Milestones/Monitoring (`milestones`),
and Completion (`status`) — with the four stages that were genuinely
missing, each scoped to what's real:

- **Review** — a structured record (`proposal_reviews`), not a
  reviewer-panel workflow; there's no defined review committee to model
  a multi-stage workflow against.
- **Scoring** — `lib/grants.ts`'s `getProposalScore` blends deterministic
  readiness checks (NGO assigned, milestones/SDGs/location/beneficiaries
  defined) with the implementing NGO's real trust score from ERT 3's
  `lib/ngo-intelligence.ts` when one exists. Cost-per-beneficiary is
  computed and shown but deliberately **not** folded into the score —
  there's no platform-wide benchmark to judge "reasonable" cost against,
  so scoring it would mean inventing a threshold.
- **Contract** — `grant_agreements` stores terms plus a timestamped
  acknowledgement from the implementing NGO (a genuine cross-tenant
  action, resolved via the NGO's own organization, not the corporate's).
  Explicitly an acknowledgement, not an e-signature — no e-sign vendor is
  integrated, so it is never presented as legally binding. Editing terms
  after acknowledgement clears it, since the NGO acknowledged specific
  terms, not whatever they become later.
- **Escrow → Disbursement ledger** — `disbursements` records amounts
  released against budget, rejecting any entry that would exceed it.
  This is explicitly bookkeeping, not fund movement — there's no payment
  processor or nodal account integrated, so nothing here executes a real
  transfer. It's also the same data ERT 2's `compliance_obligations`
  (utilization reporting) actually needs, generated as a byproduct of
  using the system rather than reconstructed at filing time.
- **Renewal** — `POST /csr-projects/:id/renew` creates a new draft
  project carrying forward the NGO partner and category, linked back via
  `renewed_from_project_id`. Only offered once the original is
  `completed`, so a renewal is always a decision about a finished grant,
  never a live one.

All of this surfaces on a new `/corporate/grants` pipeline page (a
responsive column-per-stage board: `sm:grid-cols-2 lg:grid-cols-4`, so it
reads as stacked cards on mobile and a Kanban-style board on desktop
without separate mobile/desktop implementations) and on the project
detail page (readiness score, reviews, agreement, disbursement ledger
with a utilization bar, a renew action once completed). The NGO side
gets an agreement view and acknowledgement action on its existing
"Corporate-funded projects" page — no new NGO-facing page was needed.

A new public `/grant-management` marketing page documents the capability
for discovery — and while writing its metadata, found a real, pre-existing
gap: no marketing page in the whole site sets its own Open Graph/Twitter
metadata, so every one of them (esg, compliance-automation, ai, security,
etc.) has inherited the homepage's static OG title/description since
Phase 3 — the same shallow-metadata-merge class of bug as the Phase 6
canonical-URL fix, just on a different field. Fixed for the new page;
flagged as a follow-up task for the rest of the site rather than expanding
this ERT's diff to touch every marketing page.

### Deferred, same policy as every phase above

- **Escrow with real fund movement** — no payment processor or nodal
  bank account integrated; the disbursement ledger above is the honest
  substitute (a record of intent/utilization, not execution).
- **Legally binding e-signature on the contract** — no e-sign vendor
  integrated; the agreement acknowledgement above is the honest
  substitute.
- **Reviewer-panel / multi-stage review workflow** — no defined review
  committee exists to design a workflow against (same reasoning as the
  workflow-engine deferrals in ERT 1/Phase 6).
- **A configurable "Scoring" rubric builder** — the readiness checks are
  fixed and deterministic by design; a generalized rubric engine has the
  same "no concrete backlog to generalize from" problem as every
  workflow/rules-engine deferral so far.

## ERT 5: Financial Operations — the unspent-fund rule the site already promised

The compliance-automation marketing page has claimed since Phase 3 that
"unspent-fund transfer windows are tracked automatically, not on a
spreadsheet." Until this ERT, that was aspirational copy — nothing in
the schema modeled Section 135(5)/(6) at all. That gap, found while
scoping this ERT, became its anchor: build the real rule the site was
already claiming, rather than the brief's full finance-suite list.

Section 135(5)/(6) requires a company's unspent CSR amount to move
somewhere specific by a strict deadline: for an *ongoing* project
(multi-year, sanctioned in advance — a designation a company makes in
its own board resolution, not something to infer from start/end dates),
the unspent amount goes to a special "Unspent CSR Account" within 30
days of the financial year end; for any other project, it goes to a
Schedule VII fund within 6 months. `lib/financial-operations.ts`'s
`generateUnspentFundTransferIfNeeded` computes this from real numbers
only — a project's `budget_amount` minus what ERT 4's disbursement
ledger actually shows disbursed — the moment a project is marked
`completed`, exactly mirroring how ERT 2/4 already generate obligations
on a status transition.

### Completed this ERT

- **Annual CSR budget**: `annual_csr_budgets` — the organization's
  declared obligation per fiscal year (Apr–Mar), set via
  `/organizations/:id/annual-budgets`.
- **Unspent-fund transfer register**: `unspent_fund_transfers`,
  auto-generated on project completion, tracked pending → transferred
  with an optional transfer reference — the real capability behind the
  Phase 3 marketing claim, finally built.
- **Fund utilization dashboard**: `computeOrgFundUtilization` blends the
  annual budget, in-fiscal-year disbursements, total allocated across
  projects, and pending unspent transfers into one view — surfaced on a
  new `/corporate/financials` page and as a KPI tile on the Corporate
  dashboard.
- **Expense categorization**: `disbursements` gained `vendor_name`,
  `expense_category`, `invoice_reference` — audit-ready line items
  without an accounts-payable system or file upload pipeline.
- **Disbursement pace forecast**: `computeDisbursementForecast` is an
  honest linear projection from a project's real disbursement history
  — returns `null` with fewer than two disbursements to extrapolate
  from, never a fabricated model.
- **Public `/financial-operations` page**, following the per-page
  OG/Twitter/canonical metadata pattern established for every marketing
  page.

### Deferred, same policy as every phase above

- **Payments / Escrow with real fund movement** — no payment processor
  or nodal bank account integrated; same reasoning ERT 4 already applied
  to its disbursement ledger.
- **General Ledger / ERP integration** — no SAP/Tally/Zoho Books account
  or API relationship exists to integrate with.
- **Treasury** (cash position, bank balances) — needs real banking
  integration; nothing to connect to.
- **Cost Centers** — would require inventing an internal
  department/business-unit hierarchy that doesn't exist anywhere in the
  schema; building it now means guessing at org structure no real
  customer has provided.
- **A verified vendor master** (GST/PAN validation) — that's the
  NGO-verification pipeline pattern applied to an entity nobody asked
  for; `vendor_name` stays a plain text field on the disbursement ledger
  instead.

## ERT 6: Project Execution — finishing milestones before adding a PMO around it

`milestones` has existed since Phase 2 (`db/migrations/005_csr_projects.sql`)
with **zero CRUD API** — the project detail endpoint has always returned
it read-only via `json_agg`, but nothing could ever create, update, or
complete one. Before building any of the brief's PMO capability list
(Portfolio, Program, Task, Risk, Change Request, Timeline, Gantt, Kanban,
Resource Planning), that gap got closed first — the same "finish dormant
schema" discipline as `ngo_trust_scores` before ERT 3.

### Completed this ERT

- **Milestones, finally with a real API**: `POST/GET
  /csr-projects/:id/milestones`, `PATCH .../milestones/:milestoneId` —
  create, update, and complete a milestone for the first time.
- **Programs**: a `programs` table + `csr_projects.program_id` group
  related projects under a named multi-year initiative; assignable from
  the project detail page.
- **Milestone tasks**: `milestone_tasks` — a sub-checklist under an
  existing milestone, not a new project-level concept.
- **Milestone dependencies**: `milestone_dependencies`, with a real
  cycle check (`wouldCreateDependencyCycle` walks the dependency graph
  before allowing a new link) rather than trusting the UI to prevent
  nonsense.
- **Project-scoped risk/issue log**: `project_risks` — title,
  description, severity, status, owner. Deliberately scoped to a single
  project; the enterprise-wide Risk & Audit & Assurance platform (heat
  maps, CAPA, root-cause analysis) is a distinct, later capability, not
  something this ERT should absorb.
- **Change requests**: `change_requests` for budget/timeline changes on
  an already-approved project, requiring the same `CSR.Project.Approve`
  authority as the original approval and recorded through the existing
  `governance_decisions` log — no parallel workflow engine.
- **Timeline**: `computeMilestoneTimeline` positions milestones on a 0-100
  scale between a project's start/end dates (falling back to the
  earliest/latest milestone due date) — a real visualization from actual
  data, not a scheduling engine.
- **Kanban board**: a status-column milestone board on the project detail
  page with click-to-advance actions — the same pattern ERT 4 already
  shipped for the Grants pipeline — deliberately not drag-and-drop, since
  that would mean adding a new frontend dependency for a first version.
- **Portfolio rollup**: `computePortfolioRollup` aggregates programs,
  project counts, and budget by status across an organization, surfaced
  on a new `/corporate/portfolio` page.

### Deferred, same policy as every phase above

- **Resource Planning** (staffing/hours allocation) — no HR/staffing
  data model exists anywhere in the schema; building it means inventing
  an org structure no real customer has provided, the same reasoning
  that deferred Cost Centers in ERT 5.
- **Interactive drag-and-drop Gantt** (rescheduling, resource leveling)
  — the honest version here is a real timeline visualization; a full
  scheduling engine is a materially different, much larger product.
- **The full enterprise Risk & Audit & Assurance platform** (heat maps,
  CAPA, root-cause analysis, vendor risk) — a distinct capability this
  ERT deliberately did not reach into; `project_risks` here is scoped to
  a single project's log.

## ERT 7: Field Intelligence — browser-native, not a native app promise

The brief's "Mobile-first. Offline." framing was the first thing to push
back on: this is a responsive Next.js web app, not a native mobile app,
and there is no offline-first (service-worker + local-sync) architecture
anywhere in it. Retrofitting true offline support is a different product
architecture, not a feature bolt-on — so this ERT stayed a real,
browser-native capability set instead of pretending otherwise.

### Completed this ERT

- **GPS-verified field visits**: `field_visits` records a check-in's
  coordinates (from the browser's own `navigator.geolocation`) and
  computes distance/geofence pass-fail against the project's registered
  `project_locations` using the *exact same* Haversine SQL expression
  already used by the NGO/project radius search (ADR 0002) — reused
  inline at the call site per that existing convention, not duplicated
  as a separate JS function. A project with no registered location
  simply returns a null geofence result, never a guessed one.
- **Asset register**: `project_assets` — what was actually built, with
  a GPS position and a status (planned/installed/verified/damaged).
  `evidence_url` is a plain link, the same honest pattern `milestones`
  has used since Phase 2, not a new upload system.
- **Structured surveys**: `survey_definitions` (a JSON question list —
  text/number/choice) + `survey_responses`, with answers validated
  against the question definitions server-side before insert. Pure
  structured data, no storage dependency.
- **QR codes**: `lib/field-intelligence.ts` generates an inline SVG QR
  code locally via the `qrcode` package (a small, offline, MIT-licensed
  library — not a third-party API call or vendor account) linking back
  to a project's detail page, for printable field reference.

### Deferred, same policy as every phase above

- **Camera-based photo evidence + EXIF extraction** — the pivotal
  blocker, unchanged since Phase 6: no file/object storage vendor has
  ever been chosen (no S3/R2/Render disk decision made). Photo capture
  with nowhere real to store the photo is a placeholder, not a feature.
- **Biometric identity verification** — WebAuthn (device fingerprint/face
  unlock) is real and browser-native, but it authenticates a *device*,
  not a *beneficiary's identity*; conflating the two would misrepresent
  what the platform can actually verify. Not built.
- **OTP** — no SMS gateway vendor integrated, the same recurring
  blocker as every notification-channel deferral since Phase 2.
- **Digital Signature** — no e-sign vendor, identical reasoning to
  ERT 4's grant agreement acknowledgement.
- **Voice/Video capture** — the same storage blocker as Camera, plus no
  defined use case yet.
- **Drone Integration / Satellite imagery readiness** — no vendor or
  data-partner relationship (Sentinel Hub, Planet Labs, DGCA drone ops)
  exists.
- **True offline-first mobile experience** — no native app or
  service-worker/local-sync architecture exists; this is a different
  product architecture, not a feature to bolt on.

## ERT 8: Risk, Audit & Assurance — unifying checks that already existed, not inventing new ones

The brief asked for a 15-domain "Enterprise Trust Operating System" —
an Enterprise Trust Graph, quantified risk scoring (Financial/
Reputational/Regulatory/Beneficiary Exposure, "AI Confidence"), AI risk
prediction (project failure probability, NGO governance deterioration),
a full fraud platform (pHash, device fingerprinting, behavioral
analytics), and ESG risk quantification (carbon/water exposure). Each
of these repeats a mistake this codebase has already been burned by and
corrected: presenting a number with no real data behind it as if it
were intelligence. None of the calibration data (historical outcomes,
board/director relationship data, ESG metrics, photos, device
fingerprints) exists anywhere in the schema, so none of it was built —
same discipline as ERT 3's NGO trust-score refusal.

What ERT 8 actually is: the realization that several honest checks
already existed scattered across ERT 2 (compliance obligations), ERT 3
(NGO document expiry), ERT 5 (unspent-fund transfers), ERT 6
(change-request approvals), and ERT 7 (geofence violations) — and
nobody had unified them into one view. That unification, plus a real
risk register, controls library, and audit/CAPA workflow, is the
actual capability here.

### Completed this ERT

- **Continuous Controls Monitoring**: `lib/assurance.ts`'s
  `computeControlAlerts` — a single feed combining NGO document expiry,
  field-visit geofence violations, overdue compliance obligations,
  overdue unspent-fund transfers, segregation-of-duty conflicts
  (the same user requesting and approving a change request), duplicate
  beneficiary entries, overdue CAPA items, and two honest statistical
  checks (a disbursement more than 2.5x a project's own average, a
  plain ratio — not a fraud model). Computed fresh on every request,
  nothing persisted or scored.
- **Enterprise risk register**: `project_risks` (ERT 6) extended to be
  organization-wide — still linkable to a project, no longer required
  to be.
- **Controls library**: `controls` — a real catalog (preventive/
  detective/corrective, frequency, owner), not a fabricated maturity
  index.
- **Internal Audit Management**: `audit_engagements` + `capa_items`,
  scoped to two levels rather than three — a CAPA's title and
  description carry the finding itself; a separate "finding" entity
  didn't add real capability at this stage.
- **Incident log**: `incidents` with a plain `five_whys` text array —
  the honest version of structured root-cause analysis. Fishbone/
  fault-tree diagramming tools are a separate, bigger UI commitment,
  not built here.
- **AI Copilot extended** with a real assurance summary (open risk
  count, overdue CAPA count, active alert count) — no risk score, no
  prediction, just counts of real rows.
- New `/corporate/assurance` dashboard and public `/risk-assurance`
  marketing page, same per-page OG/Twitter/canonical metadata pattern
  as every other solution page.

### Deferred, same policy as every phase above

- **Enterprise Trust Graph** — the Knowledge Graph ask declined every
  time it's come up since Phase 2: no director/trustee/board-member or
  relationship data (shared vendors, shared addresses) exists anywhere
  in the schema.
- **Quantified risk scoring** (Financial/Reputational/Regulatory/
  Beneficiary Exposure, "AI Confidence") — no real calibration data;
  fabricating these numbers would be worse than not having them, same
  reasoning as ERT 3's trust-score discipline.
- **AI Risk Prediction** (failure probability, governance deterioration,
  finding recurrence) — no historical outcome dataset to predict
  against.
- **Full Fraud Intelligence Platform** (pHash image similarity, device
  fingerprinting, behavioral analytics) — no photos or device data
  captured; only two narrow, honest statistical checks were built
  instead.
- **ESG Risk Intelligence** (carbon/water/waste quantification, BRSR/
  GRI/TCFD mapping) — no ESG metrics data has ever been captured, only
  SDG tagging.
- **External Assurance document-sharing portal** — no file storage
  vendor, unchanged since Phase 6/ERT 7.
- **Whistleblower Management** — needs a real anonymity/legal
  safe-harbor commitment, a deliberate product/legal decision, not
  something to build around silently.
- **Crisis Management playbooks, automated communications** —
  workflow-engine territory, same "no concrete backlog to generalize
  from" reasoning as every rules-engine deferral since Phase 6.
- **Seven role-aware AI copilots** — one real Copilot exists, extended
  with real context; forking it into personas without new data per
  persona repeats the UI-theater problem ERT 3 already declined.
- **Business Unit / Cost Center risk dimensions** — no internal org
  hierarchy exists, same blocker as ERT 5.
- **SSO/MFA/Zero Trust/device attestation/SIEM/ERP integrations,
  configurable dashboard builder, scheduled reports, enterprise
  semantic search** — no vendor relationships or infrastructure for
  any of these exist.

## ERT 9: ESG & Sustainability — real SDG/impact aggregation, no fabricated composite score

The brief's headline dashboard asked for eight composite indices in one
KPI row: Enterprise Sustainability Score, ESG Maturity Index, Climate
Risk Score, Carbon Score, Water Score, Social Impact Index, Community
Trust Score, Forecasted ESG Score. Every one of them needs primary data
— emissions, water withdrawal, waste diversion, stakeholder-sentiment
surveys, workforce diversity — that has never been captured anywhere in
this schema and can't be conjured from what has. This is the same
mistake ERT 3's NGO trust score and ERT 8's risk scoring were already
refused for; refusing it a third time is the point, not an oversight.

What's real: `project_sdgs` already tags every project against the 17
UN goals (since Phase 2/6), `beneficiaries` already tracks real reach
by category, and `csr_categories.schedule_vii_clause` already carries
the Schedule VII mapping. ERT 9 is the aggregation layer over that —
nothing new to collect, no new tables needed.

### Completed this ERT

- **SDG rollup** (`lib/esg.ts`'s `computeSdgRollup`): per-goal project
  count, budget, and beneficiary totals, aggregated across an
  organization's projects. Goal-level only — the brief's "169 Targets,
  232 Indicators" granularity has no real data behind it at that
  resolution.
- **Social impact summary**: real beneficiary totals by category,
  org-wide.
- **BRSR principle cross-reference**: SEBI's 9 NGRBC principles are a
  public, static taxonomy — mirrored as a constant the same way
  `lib/csr-categories.ts` mirrors seed data — with an indicative
  Schedule-VII-category-to-principle mapping. Explicitly labeled as
  indicative, not an official SEBI crosswalk, and never presented as
  BRSR-filing-ready.
- **Sustainability & Impact Overview dashboard** (`/corporate/sustainability`):
  one real page combining already-computed numbers from ERT 2
  (compliance score), ERT 5 (fund utilization), ERT 8 (active control
  alerts), and the new SDG/impact rollups — shown side by side, never
  collapsed into a fabricated composite.
- **Printable impact summary** (`/corporate/impact-report`): a
  print-optimized export (`window.print()`, no new PDF-generation
  dependency) explicitly labeled as an impact summary compiled from
  platform records, not a GRI/BRSR/TCFD-certified filing.
- **AI Copilot extended** with real SDG-coverage and beneficiary counts
  — no Sustainability Score, no carbon/water figure.
- `/esg` marketing page updated to describe what's actually measured,
  including an explicit statement of what isn't (carbon, water, waste,
  sentiment) and why.

### Deferred, same policy as every phase above

- **Carbon / Water / Waste / Biodiversity Intelligence** — zero
  emissions, utility, or ecological data captured anywhere.
- **ESG Data Fabric** (ERP/HRMS/IoT/satellite/utility-bill integrations
  with lineage and quality scoring) — no vendor integrations exist.
- **Materiality Intelligence** (stakeholder surveys, double-materiality
  matrix, benchmarking) — ERT 7's survey infrastructure could carry a
  stakeholder survey, but scoring "materiality" needs a methodology and
  benchmark data that doesn't exist and shouldn't be invented.
- **Responsible Supply Chain** — no vendor/supplier entity exists in
  the schema.
- **Stakeholder Intelligence** (sentiment analysis, influence mapping)
  — no stakeholder engagement data exists at any volume.
- **ESG Knowledge Graph / Digital Twin / Scenario Planning** — the
  Knowledge Graph ask declined since Phase 2; scenario simulation needs
  a calibrated model against historical outcomes that don't exist, same
  reasoning as ERT 8's AI Risk Prediction refusal.
- **ESG Assurance Platform** (external evidence sharing, digital
  sign-off) — no file storage vendor, unchanged since Phase 6.
- **Full multi-framework Reporting Studio** (BRSR/GRI/SASB/ISSB/TCFD
  compliant generation, PPT/Word export) — needs data points that don't
  exist; the honest printable impact summary is the real substitute.
- **A dozen+ AI personas** (Carbon Advisor, Climate Advisor, ESG
  Writer, Policy Generator...) — one real Copilot, extended.
- **The `/apps /packages /services` monorepo restructure** — the same
  microservices ask ADR 0005 has declined every time since Phase 2.
- **CEO/CFO/COO/CSO/CRO/Board/Investor distinct workspaces** — one
  real dashboard with real data, not seven personas wrapping the same
  numbers.

## ERT 10: AI Decision Intelligence — consolidation and correction, not persona proliferation

The brief asked for ten-plus AI personas (Corporate/NGO/Auditor/Board/
Executive/Legal/Finance/Project/Grant AI) plus Digital Twin AI,
Simulation, Agentic AI, Enterprise RAG, and a Knowledge Graph. Every
one of these had already been proposed and declined under a different
name in ERT 3 (persona proliferation, NGO Health Prediction), ERT 8
(seven role copilots, AI risk prediction, Knowledge Graph), and ERT 9
(a dozen+ AI advisors, Knowledge Graph again, Scenario Planning). None
of the underlying blockers changed by renaming the ask ERT 10 — no
historical outcome data to predict against, no relationship/board data
for a graph, no defined multi-agent use case. Building it a fourth
time under a new label would still be the same mistake.

What's real: the single Copilot's context has grown organically since
ERT 1 (policies, compliance, NGO alerts, assurance, sustainability).
That growth already *is* "AI touching every domain," honestly, through
one grounded assistant — it just needed tidying, not forking. Separately,
a real full-text search capability was genuinely missing and buildable
with zero new infrastructure (Postgres's native `tsvector`/`ts_rank`).

### Completed this ERT

- **Copilot consolidation**: `buildCopilotMessages` in `lib/cerebras.ts`
  refactored into an explicit list of grounding sections (organization,
  compliance, assurance, sustainability, policies, projects) rather than
  ad hoc string interpolation, with a system prompt that explicitly
  states it's one assistant spanning every wired domain. No new context
  added, no personas split off — a readability and coherence pass over
  what ERT 1–9 already built.
- **Enterprise Search** (`lib/search.ts`): Postgres full-text search
  (GIN-indexed `tsvector` + `ts_rank`) across an organization's own
  projects, governance policies, risks/issues, and incidents, with a
  search box in the Corporate workspace header and a results page.
  Explicitly not "Enterprise RAG" — there's no ingested document corpus
  or embedding index, just keyword/stem-based ranking over rows the
  caller already has permission to read. Snippets are returned as plain
  text (not `ts_headline`'s default HTML markup) specifically to avoid
  a stored-XSS risk from user-authored project/policy descriptions
  being rendered unescaped.
- **`/ai` marketing page corrected**: it had drifted stale in the
  opposite direction from the usual concern — understating what was
  real. It listed the Copilot as "Illustrative preview" and the trust
  score as "In development" long after both shipped for real in ERT 1
  and ERT 3. Both are now correctly marked "Live," alongside the new
  search capability and the ERT 5 disbursement forecast.

### Deferred, same policy as every phase above (repeated once more, for the last time under this name)

- **Role-specific AI personas** (Board/Legal/Executive/Auditor/Finance/
  Project/Grant AI) — one real Copilot, extended; forking without new
  data per persona is UI theater, same refusal as ERT 3/8/9.
- **Digital Twin AI, Simulation, Scenario Planning** — no calibrated
  model against historical outcomes exists, same as ERT 8/9.
- **Agentic AI** — no defined multi-agent orchestration use case.
- **Enterprise RAG, Knowledge Graph** — no ingested corpus or
  relationship data, the recurring blocker since Phase 2.
