import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { CreateMilestoneSchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ id: string }> };

async function loadProjectOrgId(projectId: string) {
  const { rows } = await getPool().query(
    `SELECT corporate_org_id FROM csr_projects WHERE id = $1 AND deleted_at IS NULL`,
    [projectId]
  );
  return rows[0]?.corporate_org_id ?? null;
}

/** milestones has existed since Phase 2 with no CRUD API at all — this is
 * that API, finally. GET here is a convenience for milestone-only reads;
 * the project detail endpoint continues to embed the full list too. */
export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const corporateOrgId = await loadProjectOrgId(id);
  if (!corporateOrgId) return apiError(404, "Project not found");

  await requirePermission(userId, corporateOrgId, "CSR.Project.Read");

  const { rows } = await getPool().query(
    `SELECT id, title, description, due_date, status, completed_at, evidence_url, created_at
       FROM milestones WHERE csr_project_id = $1 ORDER BY due_date ASC NULLS LAST, created_at ASC`,
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

  const input = CreateMilestoneSchema.parse(await req.json());
  await requirePermission(userId, corporateOrgId, "CSR.Project.Write");

  const { rows } = await getPool().query(
    `INSERT INTO milestones (csr_project_id, title, description, due_date)
     VALUES ($1, $2, $3, $4)
     RETURNING id, title, description, due_date, status, completed_at, evidence_url, created_at`,
    [id, input.title, input.description ?? null, input.dueDate ?? null]
  );
  return apiSuccess(rows[0]);
});
