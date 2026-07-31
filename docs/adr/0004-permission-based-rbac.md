# ADR 0004: Permission-based RBAC, not hardcoded role checks

**Status:** Accepted

## Context

The platform has multiple stakeholder types (corporate, NGO, auditor, and
more per the roadmap) each needing different capabilities, scoped per
organization (multi-tenant). A naive approach checks `if (role ===
'admin')` at each call site.

## Decision

Every authorization check tests a specific capability string (e.g.
`CSR.Project.Write`, see `lib/rbac.ts`'s `PERMISSIONS` list), never a role
name. Roles are just named bundles of permissions
(`role_permissions` table, seeded in
`db/migrations/002_core_org_auth_rbac.sql`). `can()`/`requirePermission()`
join `organization_members → role_permissions → permissions`, scoped to a
specific organization, so tenant isolation and authorization are checked
in the same query.

## Consequences

- Adding a new role, or changing what an existing role can do, is a data
  change (seed rows) — no code changes or redeploys needed.
- Call sites read as "what does this action require" rather than "who is
  allowed" — e.g. `requirePermission(userId, orgId, "CSR.Project.Approve")`
  is self-documenting.
- Cross-tenant reads (e.g. the NGO directory) use `hasAnyPermission()` —
  "does the user hold this permission in *any* org" — a deliberate,
  narrow exception to the per-org model for genuinely cross-tenant
  browsing, not a general escape hatch.
