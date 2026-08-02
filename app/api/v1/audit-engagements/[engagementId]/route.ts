import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { UpdateAuditEngagementSchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ engagementId: string }> };

export const PATCH = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { engagementId } = await ctx.params;
  const pool = getPool();

  const { rows: engagementRows } = await pool.query(
    `SELECT organization_id FROM audit_engagements WHERE id = $1`,
    [engagementId]
  );
  if (engagementRows.length === 0) return apiError(404, "Audit engagement not found");
  await requirePermission(userId, engagementRows[0].organization_id, "CSR.Project.Write");

  const input = UpdateAuditEngagementSchema.parse(await req.json());
  if (input.status === undefined) return apiError(400, "No fields to update");

  const { rows } = await pool.query(
    `UPDATE audit_engagements SET status = $1 WHERE id = $2 RETURNING id, title, status`,
    [input.status, engagementId]
  );
  return apiSuccess(rows[0]);
});
