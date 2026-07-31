# ADR 0003: Postgres-backed job queue, no Redis

**Status:** Accepted (revisit if job volume becomes a real bottleneck)

## Context

Needed a background job mechanism for sending queued notifications (and
future async work: OCR, embeddings, report generation). The conventional
choice is Redis + a queue library (BullMQ, etc.), but no Redis instance is
provisioned, and this app runs as a single Render web service with no
standalone worker process.

## Decision

A `jobs` table (`db/migrations/008_jobs.sql`) with `status`, `attempts`,
`run_after` columns, polled via `SELECT ... FOR UPDATE SKIP LOCKED`
(`lib/jobs.ts`). A GitHub Actions scheduled workflow
(`.github/workflows/process-jobs.yml`) calls a shared-secret-protected
internal endpoint every 15 minutes to process due jobs — since there's no
worker process, something external has to trigger processing.

## Consequences

- No new infrastructure or cost — reuses the Postgres already provisioned
  and GitHub Actions' free scheduled workflows.
- 15-minute worst-case latency for notification delivery — acceptable for
  the current use case (verification status emails), not for anything
  time-sensitive.
- `FOR UPDATE SKIP LOCKED` makes this safe even if invoked concurrently,
  but it's still a polling design, not push-based — at high job volume,
  polling overhead and the 15-minute cadence would need revisiting before
  Redis + a real queue becomes worth the added infrastructure.
