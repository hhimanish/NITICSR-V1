import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const pool = getPool();

  const { rows: existing } = await pool.query(`SELECT organization_id FROM delegations WHERE id = $1`, [id]);
  if (existing.length === 0) return apiError(404, "Delegation not found");

  await requirePermission(userId, existing[0].organization_id, "Governance.Delegation.Manage");

  const { rows } = await pool.query(
    `UPDATE delegations SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL RETURNING id, revoked_at`,
    [id]
  );

  if (rows.length === 0) return apiError(409, "Delegation already revoked");
  return apiSuccess(rows[0]);
});
