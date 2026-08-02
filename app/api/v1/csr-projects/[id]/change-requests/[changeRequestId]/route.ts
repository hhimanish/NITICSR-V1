import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { recordDecision } from "@/lib/governance";
import { requirePermission } from "@/lib/rbac";
import { ReviewChangeRequestSchema } from "@/lib/schemas-v1";
import { findUserByClerkId } from "@/lib/users-repo";

type RouteContext = { params: Promise<{ id: string; changeRequestId: string }> };

/** Approving a budget/timeline change requires the same authority as the
 * original project approval — reuses CSR.Project.Approve rather than a
 * separate workflow engine. */
export const PATCH = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id, changeRequestId } = await ctx.params;
  const pool = getPool();

  const { rows: projectRows } = await pool.query(
    `SELECT corporate_org_id FROM csr_projects WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  if (projectRows.length === 0) return apiError(404, "Project not found");
  const corporateOrgId = projectRows[0].corporate_org_id;
  await requirePermission(userId, corporateOrgId, "CSR.Project.Approve");

  const input = ReviewChangeRequestSchema.parse(await req.json());
  const user = await findUserByClerkId(userId);

  const { rows: crRows } = await pool.query(
    `UPDATE change_requests SET status = $1, decided_by = $2, decided_at = now()
      WHERE id = $3 AND csr_project_id = $4 AND status = 'pending'
      RETURNING id, field, requested_value`,
    [input.status, user?.id ?? null, changeRequestId, id]
  );
  if (crRows.length === 0) return apiError(404, "Pending change request not found");
  const cr = crRows[0];

  if (input.status === "approved") {
    await pool.query(`UPDATE csr_projects SET ${cr.field} = $1 WHERE id = $2`, [cr.requested_value, id]);
  }

  await recordDecision({
    organizationId: corporateOrgId,
    decidedByClerkUserId: userId,
    decisionType: `change_request.${input.status}`,
    entityType: "csr_project",
    entityId: id,
    metadata: { field: cr.field, requestedValue: cr.requested_value },
  });

  return apiSuccess({ id: cr.id, status: input.status });
});
