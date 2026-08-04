# Operations Runbook

Real failure modes for what this platform actually runs on — not a
generic template. See `docs/DEPLOYMENT.md` for setup and
`docs/ARCHITECTURE.md` for the system diagram.

## Site is down / 500s on every page

0. Check `GET /api/health` first — it checks Postgres connectivity
   specifically (`{"status":"ok","database":"ok"}` vs. a `503`) and is
   also what Render's own health check hits before routing traffic to a
   new deploy, so a failing deploy and a failing `/api/health` usually
   have the same root cause.
1. Check Render's deploy log for the web service — a failed build often
   means a missing/misconfigured env var (see the `NODE_ENV` pitfall in
   `docs/DEPLOYMENT.md`) or a migration that hasn't been run yet against a
   fresh schema. In production, the server now refuses to start at all if
   `DATABASE_URL`, `CLERK_SECRET_KEY`, or
   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is missing (`lib/config.ts`,
   `instrumentation.ts`) — look for `"Missing required environment
   variables"` in the deploy log as the exact cause rather than guessing
   from a generic crash. This check is a warning, not a hard failure, in
   local development.
2. Check Render Postgres is reachable — if `DATABASE_URL` is wrong or the
   instance was deleted (free tier: auto-deleted after 90 days), every
   page that touches the DB (which is most of them, via layout-level auth
   checks) will fail.

## AI matchmaking demo / AI Copilot not responding

1. Confirm `CEREBRAS_API_KEY` is set — both routes return a `503` with an
   explicit "not configured" message if it's missing, rather than hanging,
   so a `503` here is expected-and-diagnosable, not a mystery.
2. If configured and still failing, check Cerebras's status — there's no
   fallback provider (single point of failure by design, documented in
   `docs/ARCHITECTURE.md`, not accidental).
3. Rate limiting: both endpoints have per-IP/per-user limits
   (`lib/rate-limit.ts`) — a `429` response is the limiter working as
   intended, not a bug. Limits reset automatically; there's no manual
   override needed.

## Contact form / verification-status emails not arriving

1. Confirm `RESEND_API_KEY` is set. Email sends are best-effort in
   `/api/contact` (a delivery failure doesn't fail the lead save) — check
   Render logs for `"Failed to send contact emails"`.
   For notifications (`lib/notifications.ts`), check the `jobs` table:
   `SELECT * FROM jobs WHERE job_type = 'send_notification' AND status =
   'failed' ORDER BY created_at DESC;` — `last_error` has the real reason.
2. Confirm the GitHub Actions cron (`.github/workflows/process-jobs.yml`)
   is actually running — check the Actions tab. If `APP_URL` or
   `INTERNAL_JOB_SECRET` repo secrets aren't set, the workflow no-ops
   silently (by design, to avoid failing CI before secrets are
   configured) — nothing gets processed until they're added.

## New user can't access `/corporate`, `/ngo`, or `/auditor`

1. Confirm the Clerk webhook is configured and firing —
   `SELECT * FROM users WHERE clerk_user_id = '<their id>'`; if missing,
   the webhook either isn't configured or `CLERK_WEBHOOK_SECRET` is wrong
   (the route returns `400` on bad signatures, logged server-side).
2. If the user row exists but they're stuck on the "create your
   organization" screen repeatedly, check `organization_members` for a
   matching row — `OrgProvider` (`components/dashboard/org-context.tsx`)
   creates a new org every time none is found, so a stuck user usually
   means the creation `POST /api/v1/organizations` call is failing; check
   browser network tab / Render logs for the actual error.

## Verification requests stuck / not showing in the Auditor queue

1. Auditor visibility requires an organization of `type = 'auditor'` with
   the `auditor` role's permissions (`Verification.Review`,
   `Verification.Approve`) — check
   `SELECT o.type, r.key FROM organization_members om JOIN organizations o
   ON o.id = om.organization_id JOIN roles r ON r.id = om.role_id WHERE
   om.user_id = '<user id>';` to confirm the acting org is really type
   `auditor`, not `corporate`/`ngo`.

## Backup & disaster recovery — what's real

Render's managed Postgres (not a custom backup system) is the actual backup
mechanism: paid Render Postgres plans take automated daily backups with a
retention window set by the plan tier, restorable to a new instance from the
Render dashboard. The **free tier has no automated backups and is deleted
after 90 days of inactivity** — do not run this app's production database on
the free tier; it isn't a backup gap this codebase can close in application
code. Before relying on this in an incident, confirm the actual plan and
retention window in the Render dashboard, since those are account-level
settings this repo doesn't control or track.

Given a single Render region and a single Postgres instance, real recovery
looks like: restore the most recent Render backup to a new instance, point
`DATABASE_URL` at it, redeploy. That has a recovery point objective bounded
by the backup interval (typically up to 24h of data loss) and a recovery
time objective bounded by how long a Render restore + redeploy takes in
practice — neither has been measured with a real drill.

**Deferred, honestly**: a tested recovery drill (restore a backup and verify
data integrity end-to-end), multi-region failover, and a formal RPO/RTO
commitment to customers — each needs either a scheduled maintenance window
to test destructively, or a second Render region, neither of which has been
justified by real traffic or an enterprise SLA commitment yet. This section
replaces guessing at a DR program that doesn't exist with what Render's
platform actually provides today.

## New page/route 500s right after a deploy that added a migration

This happened for real: a freshly created production Postgres instance
had never had a single migration run against it, so every route touching
the DB failed until `npm run db:migrate` was run by hand against the
production `DATABASE_URL`. Render does not run migrations automatically —
`render.yaml` declares a `preDeployCommand` for this, but Render only
honors Pre-Deploy Command on paid instance plans; on the free plan (this
service's current plan) it's a no-op with no error surfaced. Check first:
does `GET /api/health` say `"database":"ok"` but a specific new page
still 500? That's the signature of this exact issue — the app can reach
Postgres fine, it's just missing the schema the new code expects. Fix:
run `npm run db:migrate` against the production `DATABASE_URL` (see
`docs/DEPLOYMENT.md`).

## Database migration failed partway

Each migration file runs inside its own transaction (`scripts/migrate.mjs`)
— a failure rolls back that file cleanly, and `_migrations` only records
success, so re-running `npm run db:migrate` is always safe (it skips
already-applied files and retries the failed one from a clean state).
