import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { computeMilestoneTimeline } from "@/lib/project-execution";
import { requirePermission } from "@/lib/rbac";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const pool = getPool();

  const { rows: projectRows } = await pool.query(
    `SELECT corporate_org_id, start_date, end_date FROM csr_projects WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  if (projectRows.length === 0) return apiError(404, "Project not found");
  await requirePermission(userId, projectRows[0].corporate_org_id, "CSR.Project.Read");

  const { rows: milestoneRows } = await pool.query(
    `SELECT id, title, status, due_date FROM milestones WHERE csr_project_id = $1 ORDER BY due_date ASC NULLS LAST`,
    [id]
  );

  const timeline = computeMilestoneTimeline(projectRows[0].start_date, projectRows[0].end_date, milestoneRows);
  return apiSuccess(timeline);
});
