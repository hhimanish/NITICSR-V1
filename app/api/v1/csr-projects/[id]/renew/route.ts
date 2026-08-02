import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

type RouteContext = { params: Promise<{ id: string }> };

/** Renewal is a new draft project carrying forward the prior grant's NGO
 * partner and category, linked back via renewed_from_project_id — not a
 * status transition on the original, which stays a closed historical
 * record. Only offered once the original has actually completed. */
export const POST = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const pool = getPool();

  const { rows } = await pool.query(
    `SELECT corporate_org_id, ngo_profile_id, csr_category_id, title, description, status
       FROM csr_projects WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  if (rows.length === 0) return apiError(404, "Project not found");
  const original = rows[0];

  await requirePermission(userId, original.corporate_org_id, "CSR.Project.Write");

  if (original.status !== "completed") {
    return apiError(400, "Only a completed project can be renewed");
  }

  const { rows: created } = await pool.query(
    `INSERT INTO csr_projects
       (corporate_org_id, ngo_profile_id, csr_category_id, title, description, renewed_from_project_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, title, status`,
    [
      original.corporate_org_id,
      original.ngo_profile_id,
      original.csr_category_id,
      `${original.title} (renewal)`,
      original.description,
      id,
    ]
  );
  return apiSuccess(created[0]);
});
