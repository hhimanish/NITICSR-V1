# NITICSR OS — Phase 1

India's Enterprise CSR Operating System. Phase 1 brings:

- **Public marketing site** with SEO-friendly pages on CSR compliance, solutions for corporates/NGOs/auditors, and pricing.
- **AI matchmaking demo** powered by Cerebras `gpt-oss-20b`, streaming match results over SSE with Zod-validated, seed-data-backed NGO profiles.
- **Auth-gated Corporate and NGO workspaces** (built with Clerk) with sidebar navigation, empty-state placeholder tiles for Phase 2 features, and KPI dashboards.
- **Contact form workflow** (leads → Postgres + Resend confirmation emails) and a small blog (MDX-powered, 3 seed articles on CSR compliance and NGO due diligence).

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript strict mode)
- **UI**: Tailwind CSS v4, shadcn/ui, Framer Motion (animated counters, hero stagger, section reveals)
- **AI inference**: Cerebras Cloud API (`gpt-oss-20b` via OpenAI-compatible SDK)
- **Database**: Postgres (Render managed or Supabase free tier)
- **Auth**: Clerk free tier
- **Email**: Resend free tier
- **Deploy**: Render (Infrastructure-as-Code via `render.yaml`)
- **CI**: GitHub Actions (lint + typecheck + build on every PR)

## Getting Started

### Local Development

```bash
npm install
cp .env.example .env.local
# Fill in .env.local with your API keys (see below for setup)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Setup

You'll need accounts and API keys for:

1. **Cerebras** (AI matchmaking)
   - Sign up at [https://console.cerebras.ai](https://console.cerebras.ai)
   - Get an API key from the dashboard
   - Add to `.env.local` as `CEREBRAS_API_KEY`

2. **Clerk** (Auth)
   - Create an app at [https://clerk.com](https://clerk.com) (free tier)
   - Copy publishable and secret keys to `.env.local` (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)

3. **Postgres** (Database)
   - For local dev: `postgres://localhost/niticsr_local`
   - For production: Render manages this automatically via `render.yaml`
   - Add connection string to `DATABASE_URL`

4. **Resend** (Email)
   - Sign up at [https://resend.com](https://resend.com) (free tier)
   - Get an API key and add to `.env.local` as `RESEND_API_KEY`
   - Set `CONTACT_NOTIFY_EMAIL` (where contact form submissions go)

### Build and Deploy

To Render:

1. Push this repo to GitHub
2. Create a new Web Service on Render, point to this repo, and set the environment variables (secrets) from your `.env` file
3. Render will auto-deploy on every push to `main` and will provision Postgres automatically via `render.yaml`

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

- `POST /api/match` — AI matchmaking (Cerebras call, SSE streaming, Zod validation + seed-data lookup)
- `POST /api/contact` — Contact form handler (save to Postgres, send Resend confirmation emails)

## Design Principles

- **World-class visual design**: Navy (#0F172A) / Emerald (#059669) / Amber (#F59E0B) / Sky (#0EA5E9) NITICSR brand palette. Animating hero, interactive India activity grid, scroll-triggered section reveals. Targeting Awwwards/FWA visual bar.
- **Accessibility first**: WCAG 2.2 AA minimum. All animations respect `prefers-reduced-motion`. Semantic HTML, keyboard nav, alt text.
- **Performance**: First Load JS target 243kB. Static pre-rendering where possible (all marketing routes). API routes are dynamic.
- **Type safety**: TypeScript strict mode. Zod schemas for API inputs/outputs. No `any` types.

## Known Limitations (Phase 1)

- Matchmaking demo uses fictional seed data (18 demo NGOs in `lib/seed/demo-ngos.json`), not live verified records.
- Testimonials are illustrative examples, not actual customer quotes.
- Dashboard KPI tiles show static placeholder data, not live CSR program state.
- Escrow, fund transfers, and zero-trust audit engine are Phase 2+.
- PostGIS geofencing for NGO location filtering is Phase 2+.

## Next Steps (Phase 2)

- [ ] Real NGO verification workflow and data
- [ ] In-dashboard matchmaking (not just the public demo)
- [ ] CSR spend tracking and reporting
- [ ] Unspent fund monitoring and Schedule VII compliance alerts
- [ ] Escrow and fund transfer automation
- [ ] Independent auditor access and review workflows

## Contributing

This is the NITICSR team's public Phase 1 scaffold. To propose changes or report issues:

1. Open a GitHub issue with a clear title and description
2. For code changes, fork, create a feature branch, and open a pull request

## License

Proprietary — NITICSR Technologies Pvt. Ltd.
