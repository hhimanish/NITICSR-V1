# Operations Runbook

Real failure modes for what this platform actually runs on — not a
generic template. See `docs/DEPLOYMENT.md` for setup and
`docs/ARCHITECTURE.md` for the system diagram.

## Site is down / 500s on every page

1. Check Render's deploy log for the web service — a failed build often
   means a missing/misconfigured env var (see the `NODE_ENV` pitfall in
   `docs/DEPLOYMENT.md`) or a migration that hasn't been run yet against a
   fresh schema.
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

## Database migration failed partway

Each migration file runs inside its own transaction (`scripts/migrate.mjs`)
— a failure rolls back that file cleanly, and `_migrations` only records
success, so re-running `npm run db:migrate` is always safe (it skips
already-applied files and retries the failed one from a clean state).
