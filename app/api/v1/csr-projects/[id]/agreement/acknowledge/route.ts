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

  const { rows } = await pool.query(
    `SELECT np.organization_id AS ngo_org_id
       FROM csr_projects p
       JOIN ngo_profiles np ON np.id = p.ngo_profile_id
      WHERE p.id = $1 AND p.deleted_at IS NULL`,
    [id]
  );
  if (rows.length === 0) return apiError(404, "Project or implementing NGO not found");

  // The acknowledging party is the NGO side of the partnership, not the
  // corporate that authored the terms — a cross-tenant action, same pattern
  // as an auditor reviewing another org's verification request.
  await requirePermission(userId, rows[0].ngo_org_id, "NGO.Profile.Write");

  const user = await findUserByClerkId(userId);
  const { rows: updated } = await pool.query(
    `UPDATE grant_agreements SET acknowledged_by = $1, acknowledged_at = now()
      WHERE csr_project_id = $2
      RETURNING id, terms, acknowledged_at`,
    [user?.id ?? null, id]
  );
  if (updated.length === 0) return apiError(404, "No agreement drafted for this project yet");
  return apiSuccess(updated[0]);
});
