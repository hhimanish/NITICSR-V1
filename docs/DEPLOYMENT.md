# Deployment Guide

## Architecture

Single Render web service (Next.js, Node runtime) + one Render managed
Postgres instance. No separate worker — background jobs are processed by
a GitHub Actions cron hitting an internal endpoint (see ADR 0003). No
Redis, no CDN beyond what Render/Next.js provide by default.

## First-time setup

1. **Create the Postgres database**: Render dashboard → New + → PostgreSQL
   (free tier is fine to start; note it's deleted after 90 days on free —
   upgrade before this matters for real).
2. **Create the web service**: New + → Web Service, connect this repo.
   - Build command: `npm install --include=dev && npm run build`
     (`--include=dev` matters — see the NODE_ENV pitfall below)
   - Start command: `npm start`
   - Do **not** set `NODE_ENV=production` as an env var — `next
     build`/`next start` set it internally, and setting it yourself makes
     `npm install` skip devDependencies (breaks the build: `tailwindcss`,
     `@tailwindcss/postcss`, and `typescript` are devDependencies needed
     at build time).
3. **Set environment variables** on the web service (see `.env.example`
   for the full list): `DATABASE_URL` (from the Postgres instance's
   Internal Database URL), `CEREBRAS_API_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
   `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `RESEND_API_KEY`,
   `CONTACT_NOTIFY_EMAIL`, `INTERNAL_JOB_SECRET`.
4. **Run migrations once** from your own machine against the database's
   **External** Database URL:
   ```bash
   DATABASE_URL="<external-url>" PGSSLMODE=require npm run db:migrate
   ```
5. **Configure the Clerk webhook**: Clerk dashboard → Webhooks → add
   endpoint `https://<your-domain>/api/webhooks/clerk`, subscribe to
   `user.created`, `user.updated`, `user.deleted`, copy the signing secret
   into `CLERK_WEBHOOK_SECRET`.
6. **Enable the background job cron**: add `APP_URL` (your deployed URL)
   and `INTERNAL_JOB_SECRET` (same value as the web service's) as GitHub
   Actions repo secrets — `.github/workflows/process-jobs.yml` picks them
   up automatically on its next scheduled run.

## Every subsequent deploy

Push to `main`. Render auto-deploys; GitHub Actions CI runs lint,
typecheck, migrations + tests against a real Postgres, and build — a red
CI run doesn't block the Render deploy (they're independent), so check CI
before trusting a deploy went out clean.

**New migrations**: adding a file to `db/migrations/` does not run it
automatically on deploy. `render.yaml` declares a `preDeployCommand: npm
run db:migrate` for exactly this — but Render's Pre-Deploy Command only
runs on paid instance plans, and this service is currently on the free
plan, so the declaration is a no-op until upgraded (confirmed: a direct
API call to set it on the running free-tier service silently didn't
persist). Until then, run `npm run db:migrate` against the production
`DATABASE_URL` (external URL + `PGSSLMODE=require`) by hand after the code
deploys, or before if the migration is purely additive (new tables/columns
— safe to run ahead of code that uses them). This is exactly what caused
a real incident: the production database had never had a single migration
run against it (a freshly created instance), so every page touching the
DB 500'd until this was done manually — see `docs/RUNBOOK.md`.

## Rollback

Render keeps previous deploys — use the dashboard's "Redeploy" on an
earlier successful build to roll back the app. Database migrations are
forward-only (no down-migrations are written); a bad migration needs a
new forward migration that corrects it, not a rollback.
