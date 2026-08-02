# NITICSR OS

India's Enterprise CSR Operating System — Next.js (App Router) + Postgres + Clerk + Cerebras, deployed on Render. This file orients any agent (or engineer) picking up work in this repo.

## What this is, in one paragraph

A single Next.js app (no monorepo, no microservices) providing Corporate, NGO, and Auditor workspaces for CSR project discovery, verification, governance, compliance, and NGO due-diligence — backed by one Postgres database, with a real (not mocked) Cerebras-powered AI Copilot scoped to each caller's own organization's data.

## Stack

- **Framework**: Next.js 15 (App Router), TypeScript strict mode, Tailwind CSS v4.
- **UI**: shadcn/ui on **Base UI** primitives (not Radix) — polymorphism via a `render` prop (`<Button render={<Link href="/x" />}>`), not `asChild`. Framer Motion for animation, wrapped in `components/motion/*` helpers that respect `prefers-reduced-motion`.
- **Auth**: Clerk (`@clerk/nextjs`), route protection via `clerkMiddleware`/`createRouteMatcher` in `middleware.ts`, user/org sync via a svix-verified webhook (`app/api/webhooks/clerk`).
- **Database**: Postgres only (see ADR 0001) — plain SQL migrations in `db/migrations/`, no ORM. Applied via `scripts/migrate.mjs`, tracked in a `_migrations` table, one transaction per file. Run with `npm run db:migrate`.
- **AI**: Cerebras Cloud (`gpt-oss-20b`) via the OpenAI-compatible SDK, `lib/cerebras.ts`. Every AI surface is labeled "AI-generated, not verified" and logs model version + Q&A into `audit_logs`.
- **Hosting**: Render — one Node web service + managed Postgres, `render.yaml` as IaC. CI is GitHub Actions: lint → typecheck → migrate against a real `postgres:15` service container → test → build.

## The one rule that matters most: read ADR 0005 first

**[docs/adr/0005-defer-features-without-real-backing-infra.md](docs/adr/0005-defer-features-without-real-backing-infra.md)** is the load-bearing decision of this entire codebase. This product has been pitched, repeatedly, at Fortune-500 enterprise-SaaS scope (Salesforce/ServiceNow/SAP-grade capability maps, 12+ "Enterprise Release Trains," knowledge graphs, workflow/rules engines, fraud detection, MFA/SSO, microservice monorepos). Nearly none of that scope gets built as literally specified. The standing policy:

1. **Never fabricate a number or capability that has no real data or infra behind it.** A trust score, health index, or fraud signal computed from data the platform doesn't actually have is worse than not building it — it looks like real due diligence and isn't. See `docs/ARCHITECTURE.md`'s "ERT 3" section for the sharpest example of this reasoning.
2. **Defer with a specific, concrete blocker**, not "too big": missing vendor account (payment processor, e-signature, SMS/S3), missing real data source (no financial statements, no board data, no regulatory corpus), missing prerequisite (no file upload pipeline yet, so no "evidence vault"), or no real customer to design against (no actual Board/Committee to model parliamentary procedure for).
3. **Finish unused schema before adding new speculative architecture.** Several tables have shipped a phase or two ahead of their API/UI (`ngo_trust_scores`, `project_sdgs`, `feature_flags` all sat dormant before being wired up). Check `db/migrations/*.sql` for columns/tables with no corresponding route before creating something new.
4. **No monorepo/microservices/Kubernetes split.** This is one app on one Postgres instance by deliberate choice (ADR 0001, ADR 0005) — there is no ops team or scaling need that justifies the operational cost, no matter how many times "apps/{web,api,mobile}  + packages/*" gets requested.
5. **Document every gap.** `docs/ARCHITECTURE.md` has a section per phase/ERT: what was asked for, what got built, what got deferred and why. Read the last few sections before proposing new scope — they show exactly which capabilities have already been declined and the reasoning, so the same ground doesn't get re-litigated.

When a new large spec arrives, the expected response is: identify the genuinely real, buildable slice; identify what's deferred and why (specific blocker, not vibes); propose the scoped plan; wait for explicit approval before building.

## Directory map

```
app/
  (marketing)/        Public site — home, solutions, blog, case studies (SEO'd, some content marked illustrative)
  (corporate)/         Corporate workspace: dashboard, discovery, projects, compliance, governance, settings
  (ngo)/               NGO workspace: dashboard, matches, verification, settings
  (auditor)/           Auditor workspace: review queue
  api/
    v1/                Versioned REST API — organizations, ngo-profiles, csr-projects, verification-requests,
                       governance/*, delegations, compliance-obligations, ngo-documents, feature-flags
    copilot/           AI Copilot endpoint (org-scoped, rate-limited)
    match/             Public AI matchmaking demo (unauthenticated, demo NGO data only)
    webhooks/clerk/    User/org sync
    internal/          Cron-triggered job processing (shared-secret protected)

components/
  ui/                  shadcn primitives (Base UI)
  dashboard/           Workspace shell, nav, org-context, KPI tiles, AI Copilot panel
  design-system/       Reusable product widgets (trust score, verification badge, mega menu, timeline...)
  site/                Public site chrome (header, footer, theme toggle, consent banner)
  motion/              Reduced-motion-aware animation wrappers
  sections/            Marketing homepage sections

lib/
  db.ts                Postgres pool
  rbac.ts              Permission-based authorization — see below
  api-utils.ts         withApiErrors, apiSuccess/apiError, paginationParams
  schemas-v1.ts        Zod schemas for all v1 API input
  governance.ts        Immutable decision log (recordDecision)
  compliance.ts        Compliance obligations + deterministic gap checks + score
  ngo-intelligence.ts  Honest NGO trust score (only real components — see ADR 0005 note above)
  grants.ts            Grant readiness score + disbursement ledger math (ERT 4)
  financial-operations.ts   Fiscal-year math, Section 135(5)/(6) unspent-fund transfers, honest forecast (ERT 5)
  project-execution.ts Milestone timeline math, dependency-cycle check, portfolio rollup (ERT 6)
  cerebras.ts          AI Copilot client + prompt construction
  feature-flags.ts     Org-override-then-global-default flag reads
  notifications.ts, jobs.ts   Postgres-backed queue, no Redis (ADR 0003)

db/migrations/         Numbered plain-SQL migrations, one file per logical change, always idempotent
                       (IF NOT EXISTS / ON CONFLICT DO NOTHING) so re-running is always safe

docs/
  ARCHITECTURE.md      Domain map + a section per phase: built vs. deferred vs. why
  adr/                 Architecture Decision Records — read 0005 first
  openapi.yaml         API reference, hand-maintained alongside each new route
  runbook.md, deployment.md, security.md   Ops docs from Phase 5
```

## Conventions to follow

- **Permission checks, not role checks.** `lib/rbac.ts`'s `can()`/`requirePermission()` check a capability string (`"CSR.Project.Write"`), never a role name. Add new permissions to the `PERMISSIONS` const and seed `role_permissions` in the migration — never branch on `role.key === 'corporate_admin'` in application code.
- **Every route wrapped in `withApiErrors`**, returns via `apiSuccess`/`apiError`. Input validated with a Zod schema from `lib/schemas-v1.ts` before touching the database.
- **Migrations are additive and idempotent.** `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `ON CONFLICT DO NOTHING`. Never edit a migration that has already shipped — add a new numbered file.
- **Cross-tenant reads use `hasAnyPermission`**, not a single organization's `can()` — see `/api/v1/ngo-profiles` (the NGO directory) for the pattern. Cross-tenant responses must never leak another organization's specific record details (see `computeNgoPartnershipStats` in `lib/ngo-intelligence.ts` for the aggregate-only pattern that avoids this).
- **Every AI response is labeled and grounded.** The Copilot only ever answers from data explicitly included in its context for the caller's own organization; the system prompt always instructs it to say "I don't know" rather than invent a figure.
- **No comments explaining *what* the code does.** Comments only where they explain a non-obvious *why* — a scoping decision, a constraint, a workaround. Terse, minimal.

## Commands

```
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm test            # vitest run (DB-dependent tests skip without DATABASE_URL)
npm run build       # next build
npm run db:migrate  # apply pending migrations
```

Run all four (lint, typecheck, test, build) before every commit — this has been true since Phase 1 and CI enforces the same sequence against a real Postgres service container.

## Commit style

Feature-summary commit messages that state what shipped **and** why anything adjacent was deliberately left out, in prose (not just a bullet list) — see recent commit messages (`git log`) for the expected depth. No `Co-Authored-By` trailer in this repo's convention. Never commit `.claude/`.
