import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { z } from "zod";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

type RouteContext = { params: Promise<{ id: string; milestoneId: string; taskId: string }> };

const ToggleTaskSchema = z.object({ status: z.enum(["pending", "done"]) });

export const PATCH = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id, milestoneId, taskId } = await ctx.params;
  const pool = getPool();

  const { rows: orgRows } = await pool.query(
    `SELECT p.corporate_org_id FROM milestones m
       JOIN csr_projects p ON p.id = m.csr_project_id
      WHERE m.id = $1 AND m.csr_project_id = $2 AND p.deleted_at IS NULL`,
    [milestoneId, id]
  );
  if (orgRows.length === 0) return apiError(404, "Milestone not found");
  await requirePermission(userId, orgRows[0].corporate_org_id, "CSR.Project.Write");

  const input = ToggleTaskSchema.parse(await req.json());
  const { rows } = await pool.query(
    `UPDATE milestone_tasks SET status = $1, done_at = $2
      WHERE id = $3 AND milestone_id = $4
      RETURNING id, title, status, done_at`,
    [input.status, input.status === "done" ? new Date().toISOString() : null, taskId, milestoneId]
  );
  if (rows.length === 0) return apiError(404, "Task not found");
  return apiSuccess(rows[0]);
});
