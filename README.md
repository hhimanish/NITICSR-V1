# NITICSR OS

India's Enterprise CSR Operating System.

**Phase 1** brought the public platform:

- **Public marketing site** with SEO-friendly pages on CSR compliance, solutions for corporates/NGOs/auditors, and pricing.
- **AI matchmaking demo** powered by Cerebras `gpt-oss-20b`, streaming match results over SSE with Zod-validated, seed-data-backed NGO profiles.
- **Auth-gated Corporate and NGO workspaces** (built with Clerk) with sidebar navigation and KPI dashboards.
- **Contact form workflow** (leads → Postgres + Resend confirmation emails) and a small blog (MDX-powered, 3 seed articles on CSR compliance and NGO due diligence).

**Phase 2** adds the enterprise backend foundation everything above (and Phase 3) runs on:

- **Multi-tenant Postgres schema** with plain-SQL migrations (`db/migrations/`) — organizations, NGO profiles, CSR projects, verification workflow, notifications, jobs.
- **Permission-based RBAC** (`lib/rbac.ts`) — call sites check capabilities like `CSR.Project.Write`, never a hardcoded role name.
- **Versioned REST API** (`/api/v1/*`) for organizations, NGO profiles, CSR projects, and a manual-review verification workflow, documented in [`docs/openapi.yaml`](docs/openapi.yaml).
- **Clerk webhook sync** (`/api/webhooks/clerk`) keeping a local `users` table in sync with Clerk identity.
- **Notification service + DB-backed job queue** — no Redis; a GitHub Actions cron calls an internal endpoint every 15 minutes to process jobs.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full architecture/ER diagrams and — importantly — what was **deliberately deferred** (escrow, zero-trust mobile audit, PostGIS, pgvector) and why.

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript strict mode)
- **UI**: Tailwind CSS v4, shadcn/ui, Framer Motion (animated counters, hero stagger, section reveals)
- **AI inference**: Cerebras Cloud API (`gpt-oss-20b` via OpenAI-compatible SDK)
- **Database**: Postgres (Render managed or Supabase free tier)
- **Auth**: Clerk free tier
- **Email**: Resend free tier
- **Deploy**: Render (Infrastructure-as-Code via `render.yaml`)
- **CI**: GitHub Actions (lint + typecheck + migrate + test + build on every PR, against a real Postgres service container)
- **Background jobs**: Postgres-backed queue (`lib/jobs.ts`), processed via a GitHub Actions scheduled workflow — no Redis

## Getting Started

### Local Development

```bash
npm install
cp .env.example .env.local
# Fill in .env.local with your API keys (see below for setup)
npm run db:migrate   # applies db/migrations/*.sql — needs DATABASE_URL set
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Run the test suite with `npm test` (pure unit tests always run; the RBAC
integration test in `lib/rbac.test.ts` skips automatically if `DATABASE_URL`
isn't set).

### Environment Setup

You'll need accounts and API keys for:

1. **Cerebras** (AI matchmaking)
   - Sign up at [https://console.cerebras.ai](https://console.cerebras.ai)
   - Get an API key from the dashboard
   - Add to `.env.local` as `CEREBRAS_API_KEY`

2. **Clerk** (Auth)
   - Create an app at [https://clerk.com](https://clerk.com) (free tier)
   - Copy publishable and secret keys to `.env.local` (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)
   - Add a webhook endpoint pointing at `/api/webhooks/clerk` (events: `user.created`, `user.updated`, `user.deleted`) and copy its signing secret to `CLERK_WEBHOOK_SECRET`

3. **Postgres** (Database)
   - For local dev: `postgres://localhost/niticsr_local`
   - For production: Render manages this automatically via `render.yaml`
   - Add connection string to `DATABASE_URL`, then run `npm run db:migrate`

4. **Resend** (Email)
   - Sign up at [https://resend.com](https://resend.com) (free tier)
   - Get an API key and add to `.env.local` as `RESEND_API_KEY`
   - Set `CONTACT_NOTIFY_EMAIL` (where contact form submissions go)

5. **Background jobs** (optional but recommended)
   - Set `INTERNAL_JOB_SECRET` to any random string, both in your deployment's env vars and as `INTERNAL_JOB_SECRET` in this repo's GitHub Actions secrets
   - Also set `APP_URL` as a GitHub Actions secret (your deployed URL) — `.github/workflows/process-jobs.yml` calls it every 15 minutes to send queued notifications

### Build and Deploy

To Render:

1. Push this repo to GitHub
2. Create a new Web Service on Render, point to this repo, and set the environment variables (secrets) from your `.env` file
3. Render will auto-deploy on every push to `main` and will provision Postgres automatically via `render.yaml`
4. Run migrations against that Postgres instance once (from your machine, with `DATABASE_URL` set to Render's **external** connection string and `PGSSLMODE=require`): `npm run db:migrate`

For local production builds:

```bash
npm run build
npm start
```

## Routes Overview

### Public Marketing (no auth required)

- `/` — Home (hero, trust bar, India activity grid, AI matchmaking demo, SDG goals, testimonials, FAQ, CTA)
- `/platform` — Platform overview
- `/solutions/corporate` — Corporate CSR solution page
- `/solutions/ngos` — NGO solution page
- `/solutions/auditors` — Auditor solution page
- `/pricing` — Tiered pricing (custom pricing contact form)
- `/blog` — Blog index
- `/blog/[slug]` — Individual blog posts (MDX-powered)
- `/about` — About us
- `/contact` — Contact form

### Gated Workspaces (Clerk auth required)

- `/corporate/` — Corporate dashboard (sidebar with nav)
  - `dashboard` — KPI tiles (illustrative demo data)
  - `discovery` — NGO Discovery (empty state, coming Phase 2)
  - `compliance` — Compliance tracking (empty state, coming Phase 2)
  - `settings` — Settings (empty state, coming Phase 2)

- `/ngo/` — NGO dashboard (sidebar with nav)
  - `dashboard` — KPI tiles (illustrative demo data)
  - `matches` — Corporate matches inbox (empty state, coming Phase 2)
  - `verification` — Verification status (empty state, coming Phase 2)
  - `settings` — Settings (empty state, coming Phase 2)

### API Routes

**Phase 1**
- `POST /api/match` — AI matchmaking (Cerebras call, SSE streaming, Zod validation + seed-data lookup)
- `POST /api/contact` — Contact form handler (save to Postgres, send Resend confirmation emails)

**Phase 2** — see [`docs/openapi.yaml`](docs/openapi.yaml) for full request/response shapes
- `GET/POST /api/v1/organizations` — list orgs you belong to / create one
- `GET/PATCH /api/v1/organizations/:id/ngo-profile` — view/edit an NGO profile
- `GET/POST /api/v1/csr-projects`, `GET/PATCH /api/v1/csr-projects/:id` — CSR project CRUD
- `GET/POST /api/v1/verification-requests`, `PATCH /api/v1/verification-requests/:id` — manual-review verification workflow
- `POST /api/webhooks/clerk` — Clerk user lifecycle sync (svix-verified)
- `POST /api/internal/process-jobs` — background job processor (shared-secret protected, called by GitHub Actions on a schedule)

## Design Principles

- **World-class visual design**: Navy (#0F172A) / Emerald (#059669) / Amber (#F59E0B) / Sky (#0EA5E9) NITICSR brand palette. Animating hero, interactive India activity grid, scroll-triggered section reveals. Targeting Awwwards/FWA visual bar.
- **Accessibility first**: WCAG 2.2 AA minimum. All animations respect `prefers-reduced-motion`. Semantic HTML, keyboard nav, alt text.
- **Performance**: First Load JS target 243kB. Static pre-rendering where possible (all marketing routes). API routes are dynamic.
- **Type safety**: TypeScript strict mode. Zod schemas for API inputs/outputs. No `any` types.

## Known Limitations

- Matchmaking demo (`/api/match`) still uses fictional seed data, not the real `/api/v1` data model — wiring the public demo to live data is Phase 3.
- Dashboard KPI tiles show static placeholder data; wiring the Corporate/NGO portals to `/api/v1` is Phase 3.
- Verification is a manual-review workflow (`verification_requests`/`verification_checks`) — there's no live MCA21/DARPAN/Income Tax/GST/FCRA integration, since none of those expose public self-serve APIs.
- Escrow, zero-trust mobile audit (GPS/EXIF/device attestation), PostGIS geospatial queries, and pgvector semantic search are intentionally deferred — see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#deferred-to-roadmap) for why and what the extension points look like.

## Next Steps (Phase 3)

- [ ] Wire the Corporate/NGO dashboards to the real `/api/v1` endpoints
- [ ] NGO onboarding flow (profile, documents, cause areas) backed by `/api/v1/organizations/:id/ngo-profile`
- [ ] Auditor portal for the verification review queue
- [ ] CSR spend tracking/reporting UI on top of `csr_projects`/`milestones`
- [ ] Unspent fund monitoring and Schedule VII compliance alerts
- [ ] Public-facing verified NGO/project directory (structured, cacheable, SEO/LLM-friendly per the Phase 2 roadmap notes)

## Contributing

This is the NITICSR team's public Phase 1 scaffold. To propose changes or report issues:

1. Open a GitHub issue with a clear title and description
2. For code changes, fork, create a feature branch, and open a pull request

## License

Proprietary — NITICSR Technologies Pvt. Ltd.
