import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { wouldCreateDependencyCycle } from "@/lib/project-execution";
import { requirePermission } from "@/lib/rbac";
import { CreateMilestoneDependencySchema } from "@/lib/schemas-v1";

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
    `SELECT md.id, md.depends_on_milestone_id, m.title AS depends_on_title
       FROM milestone_dependencies md
       JOIN milestones m ON m.id = md.depends_on_milestone_id
      WHERE md.milestone_id = $1`,
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

  const input = CreateMilestoneDependencySchema.parse(await req.json());
  await requirePermission(userId, corporateOrgId, "CSR.Project.Write");

  const dependsOnOrgId = await loadMilestoneOrgId(id, input.dependsOnMilestoneId);
  if (!dependsOnOrgId) return apiError(400, "dependsOnMilestoneId must be a milestone on the same project");

  if (await wouldCreateDependencyCycle(milestoneId, input.dependsOnMilestoneId)) {
    return apiError(400, "That dependency would create a cycle");
  }

  const { rows } = await getPool().query(
    `INSERT INTO milestone_dependencies (milestone_id, depends_on_milestone_id)
     VALUES ($1, $2)
     ON CONFLICT (milestone_id, depends_on_milestone_id) DO NOTHING
     RETURNING id, depends_on_milestone_id`,
    [milestoneId, input.dependsOnMilestoneId]
  );
  return apiSuccess(rows[0] ?? null);
});
