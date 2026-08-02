import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { CreateMilestoneTaskSchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ id: string; milestoneId: string }> };

async function loadMilestoneOrgId(projectId: string, milestoneId: string) {
  const { rows } = await getPool().query(
    `SELECT p.corporate_org_id FROM milestones m
       JOIN csr_projects p ON p.id = m.csr_project_id
      WHERE m.id = $1 AND m.csr_project_id = $2 AND p.deleted_at IS NULL`,
    [milestoneId, projectId]
  );
  return rows[0]?.corporate_org_id ?? null;
}

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id, milestoneId } = await ctx.params;
  const corporateOrgId = await loadMilestoneOrgId(id, milestoneId);
  if (!corporateOrgId) return apiError(404, "Milestone not found");

  await requirePermission(userId, corporateOrgId, "CSR.Project.Read");

  const { rows } = await getPool().query(
    `SELECT id, title, status, done_at, created_at FROM milestone_tasks
      WHERE milestone_id = $1 ORDER BY created_at ASC`,
    [milestoneId]
  );
  return apiSuccess(rows);
});

export const POST = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id, milestoneId } = await ctx.params;
  const corporateOrgId = await loadMilestoneOrgId(id, milestoneId);
  if (!corporateOrgId) return apiError(404, "Milestone not found");

  const input = CreateMilestoneTaskSchema.parse(await req.json());
  await requirePermission(userId, corporateOrgId, "CSR.Project.Write");

  const { rows } = await getPool().query(
    `INSERT INTO milestone_tasks (milestone_id, title) VALUES ($1, $2)
     RETURNING id, title, status, done_at, created_at`,
    [milestoneId, input.title]
  );
  return apiSuccess(rows[0]);
});
