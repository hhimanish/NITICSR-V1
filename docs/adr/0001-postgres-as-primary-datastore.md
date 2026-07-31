# ADR 0001: Postgres as the primary datastore

**Status:** Accepted

## Context

Needed to pick a database for Phase 2's enterprise schema: organizations,
RBAC, NGO profiles, CSR projects, verification workflow. Candidates
discussed: Render's managed Postgres, MongoDB, Supabase.

## Decision

Postgres, hosted on Render's managed Postgres.

CSR domain data is inherently relational — organizations have members with
roles, roles have permissions, projects belong to an organization and
optionally an NGO profile, verification requests reference both an NGO
profile and a reviewer. Foreign keys, joins, and transactions are the
natural fit; modeling this in MongoDB would mean either denormalizing
(duplicating data, risking drift) or manually enforcing referential
integrity application-side that Postgres gives for free.

Supabase was considered and is Postgres-compatible (same schema/migrations
would work unchanged), but since Clerk already handles auth and no other
Supabase-specific feature was needed, it added a vendor without adding
capability — Render's Postgres, already used for the web service, was
simpler.

## Consequences

- All schema is plain SQL migrations (`db/migrations/`), no ORM.
- Switching to Supabase later is a `DATABASE_URL` change, not a rewrite,
  since both are Postgres.
- Switching to a document store would require a full data-layer rewrite —
  not expected to be revisited.
