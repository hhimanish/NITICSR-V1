import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { CreateProposalReviewSchema } from "@/lib/schemas-v1";
import { findUserByClerkId } from "@/lib/users-repo";

type RouteContext = { params: Promise<{ id: string }> };

async function loadProjectOrgId(projectId: string) {
  const { rows } = await getPool().query(
    `SELECT corporate_org_id FROM csr_projects WHERE id = $1 AND deleted_at IS NULL`,
    [projectId]
  );
  return rows[0]?.corporate_org_id ?? null;
}

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const corporateOrgId = await loadProjectOrgId(id);
  if (!corporateOrgId) return apiError(404, "Project not found");

  await requirePermission(userId, corporateOrgId, "CSR.Project.Read");

  const { rows } = await getPool().query(
    `SELECT pr.id, pr.recommendation, pr.notes, pr.created_at, u.full_name AS reviewed_by_name
       FROM proposal_reviews pr
       LEFT JOIN users u ON u.id = pr.reviewed_by
      WHERE pr.csr_project_id = $1
      ORDER BY pr.created_at DESC`,
    [id]
  );
  return apiSuccess(rows);
});

export const POST = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const corporateOrgId = await loadProjectOrgId(id);
  if (!corporateOrgId) return apiError(404, "Project not found");

  const input = CreateProposalReviewSchema.parse(await req.json());
  await requirePermission(userId, corporateOrgId, "CSR.Project.Write");

  const user = await findUserByClerkId(userId);
  const { rows } = await getPool().query(
    `INSERT INTO proposal_reviews (csr_project_id, reviewed_by, recommendation, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING id, recommendation, notes, created_at`,
    [id, user?.id ?? null, input.recommendation, input.notes ?? null]
  );
  return apiSuccess(rows[0]);
});
