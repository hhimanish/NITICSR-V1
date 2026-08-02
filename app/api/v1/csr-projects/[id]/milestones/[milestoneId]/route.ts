import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { UpdateMilestoneSchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ id: string; milestoneId: string }> };

export const PATCH = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id, milestoneId } = await ctx.params;
  const pool = getPool();

  const { rows: projectRows } = await pool.query(
    `SELECT corporate_org_id FROM csr_projects WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  if (projectRows.length === 0) return apiError(404, "Project not found");
  await requirePermission(userId, projectRows[0].corporate_org_id, "CSR.Project.Write");

  const input = UpdateMilestoneSchema.parse(await req.json());

  const fields: string[] = [];
  const values: unknown[] = [];
  const setField = (column: string, value: unknown) => {
    values.push(value);
    fields.push(`${column} = $${values.length}`);
  };

  if (input.title !== undefined) setField("title", input.title);
  if (input.description !== undefined) setField("description", input.description);
  if (input.dueDate !== undefined) setField("due_date", input.dueDate);
  if (input.evidenceUrl !== undefined) setField("evidence_url", input.evidenceUrl);
  if (input.status !== undefined) {
    setField("status", input.status);
    setField("completed_at", input.status === "completed" ? new Date().toISOString() : null);
  }

  if (fields.length === 0) return apiError(400, "No fields to update");

  values.push(milestoneId, id);
  const { rows } = await pool.query(
    `UPDATE milestones SET ${fields.join(", ")}
      WHERE id = $${values.length - 1} AND csr_project_id = $${values.length}
      RETURNING id, title, description, due_date, status, completed_at, evidence_url`,
    values
  );
  if (rows.length === 0) return apiError(404, "Milestone not found");
  return apiSuccess(rows[0]);
});
