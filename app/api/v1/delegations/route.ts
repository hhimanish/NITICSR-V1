import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { can, PERMISSIONS, requirePermission, type Permission } from "@/lib/rbac";
import { CreateDelegationSchema } from "@/lib/schemas-v1";
import { findUserByClerkId } from "@/lib/users-repo";

export const GET = withApiErrors(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const organizationId = req.nextUrl.searchParams.get("organizationId");
  if (!organizationId) return apiError(400, "organizationId query param is required");

  await requirePermission(userId, organizationId, "Organization.Read");

  const { rows } = await getPool().query(
    `SELECT d.id, d.permission_key, d.starts_at, d.ends_at, d.revoked_at,
            delegator.full_name AS delegator_name, delegate.full_name AS delegate_name
       FROM delegations d
       JOIN users delegator ON delegator.id = d.delegator_user_id
       JOIN users delegate ON delegate.id = d.delegate_user_id
      WHERE d.organization_id = $1
      ORDER BY d.created_at DESC`,
    [organizationId]
  );

  return apiSuccess(rows);
});

export const POST = withApiErrors(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const input = CreateDelegationSchema.parse(await req.json());
  await requirePermission(userId, input.organizationId, "Governance.Delegation.Manage");

  if (!PERMISSIONS.includes(input.permissionKey as Permission)) {
    return apiError(400, `Unknown permissionKey: ${input.permissionKey}`);
  }
  const permissionKey = input.permissionKey as Permission;

  // You can only delegate a permission you actually hold — prevents
  // escalating authority you don't have via a delegation record.
  if (!(await can(userId, input.organizationId, permissionKey))) {
    return apiError(400, `You don't hold ${permissionKey} in this organization, so it can't be delegated`);
  }

  const delegator = await findUserByClerkId(userId);
  if (!delegator) return apiError(409, "User record not yet synced from Clerk");

  const pool = getPool();
  const { rows: memberCheck } = await pool.query(
    `SELECT 1 FROM organization_members WHERE organization_id = $1 AND user_id = $2`,
    [input.organizationId, input.delegateUserId]
  );
  if (memberCheck.length === 0) return apiError(400, "delegateUserId is not a member of this organization");

  const { rows } = await pool.query(
    `INSERT INTO delegations (organization_id, delegator_user_id, delegate_user_id, permission_key, ends_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, permission_key, starts_at, ends_at`,
    [input.organizationId, delegator.id, input.delegateUserId, permissionKey, input.endsAt]
  );

  return apiSuccess(rows[0]);
});
