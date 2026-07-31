import { getPool } from "@/lib/db";

/**
 * Permission-based authorization. Callers check a specific capability
 * (e.g. "CSR.Project.Write") rather than branching on a role name, so adding
 * a new role or changing what an existing role can do never requires
 * touching call sites — only the role_permissions seed data.
 */
export const PERMISSIONS = [
  "Organization.Read",
  "Organization.Write",
  "Organization.ManageMembers",
  "NGO.Profile.Read",
  "NGO.Profile.Write",
  "NGO.Verify",
  "CSR.Project.Read",
  "CSR.Project.Write",
  "CSR.Project.Approve",
  "Verification.Submit",
  "Verification.Review",
  "Verification.Approve",
  "Audit.Submit",
  "Audit.Approve",
  "Corporate.Approve",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export class ForbiddenError extends Error {
  constructor(permission: string) {
    super(`Missing required permission: ${permission}`);
    this.name = "ForbiddenError";
  }
}

export async function can(clerkUserId: string, organizationId: string, permission: Permission) {
  const { rows } = await getPool().query(
    `SELECT 1
       FROM organization_members om
       JOIN users u ON u.id = om.user_id
       JOIN role_permissions rp ON rp.role_id = om.role_id
       JOIN permissions p ON p.id = rp.permission_id
      WHERE u.clerk_user_id = $1
        AND om.organization_id = $2
        AND p.key = $3
      LIMIT 1`,
    [clerkUserId, organizationId, permission]
  );
  return rows.length > 0;
}

/** Throws ForbiddenError if the check fails — convenient for route handlers
 * that want a single early-return guard clause. */
export async function requirePermission(
  clerkUserId: string,
  organizationId: string,
  permission: Permission
) {
  const allowed = await can(clerkUserId, organizationId, permission);
  if (!allowed) throw new ForbiddenError(permission);
}

export async function listUserPermissions(clerkUserId: string, organizationId: string) {
  const { rows } = await getPool().query(
    `SELECT DISTINCT p.key
       FROM organization_members om
       JOIN users u ON u.id = om.user_id
       JOIN role_permissions rp ON rp.role_id = om.role_id
       JOIN permissions p ON p.id = rp.permission_id
      WHERE u.clerk_user_id = $1
        AND om.organization_id = $2`,
    [clerkUserId, organizationId]
  );
  return rows.map((r) => r.key as Permission);
}

export async function getUserRole(clerkUserId: string, organizationId: string) {
  const { rows } = await getPool().query(
    `SELECT r.key, r.name
       FROM organization_members om
       JOIN users u ON u.id = om.user_id
       JOIN roles r ON r.id = om.role_id
      WHERE u.clerk_user_id = $1
        AND om.organization_id = $2
      LIMIT 1`,
    [clerkUserId, organizationId]
  );
  return rows[0] ?? null;
}
