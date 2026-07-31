import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

type RouteContext = { params: Promise<{ id: string }> };

/** Minimal member list — just enough to power the delegation picker.
 * Full member management (invite/remove/re-role) is roadmap. */
export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "Organization.Read");

  const { rows } = await getPool().query(
    `SELECT u.id AS user_id, u.full_name, u.email, r.key AS role_key
       FROM organization_members om
       JOIN users u ON u.id = om.user_id
       JOIN roles r ON r.id = om.role_id
      WHERE om.organization_id = $1
      ORDER BY u.full_name NULLS LAST, u.email`,
    [organizationId]
  );

  return apiSuccess(rows);
});
