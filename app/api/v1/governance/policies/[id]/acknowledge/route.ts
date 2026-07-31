import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { findUserByClerkId } from "@/lib/users-repo";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const pool = getPool();

  const { rows: policyRows } = await pool.query(
    `SELECT organization_id FROM governance_policies WHERE id = $1`,
    [id]
  );
  if (policyRows.length === 0) return apiError(404, "Policy not found");

  await requirePermission(userId, policyRows[0].organization_id, "Governance.Policy.Read");
  const user = await findUserByClerkId(userId);
  if (!user) return apiError(409, "User record not yet synced from Clerk");

  await pool.query(
    `INSERT INTO policy_acknowledgements (policy_id, user_id) VALUES ($1, $2)
     ON CONFLICT (policy_id, user_id) DO NOTHING`,
    [id, user.id]
  );

  return apiSuccess({ acknowledged: true });
});
