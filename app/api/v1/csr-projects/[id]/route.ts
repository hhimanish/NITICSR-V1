import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { can, requirePermission } from "@/lib/rbac";
import { UpdateCsrProjectSchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ id: string }> };

async function loadProjectOrgId(projectId: string) {
  const { rows } = await getPool().query(`SELECT corporate_org_id FROM csr_projects WHERE id = $1 AND deleted_at IS NULL`, [
    projectId,
  ]);
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
    `SELECT p.*,
            c.key AS csr_category_key,
            (SELECT json_agg(pl) FROM project_locations pl WHERE pl.csr_project_id = p.id) AS locations,
            (SELECT json_agg(m) FROM milestones m WHERE m.csr_project_id = p.id) AS milestones
       FROM csr_projects p
       JOIN csr_categories c ON c.id = p.csr_category_id
      WHERE p.id = $1 AND p.deleted_at IS NULL`,
    [id]
  );

  if (rows.length === 0) return apiError(404, "Project not found");
  return apiSuccess(rows[0]);
});

export const PATCH = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const corporateOrgId = await loadProjectOrgId(id);
  if (!corporateOrgId) return apiError(404, "Project not found");

  const input = UpdateCsrProjectSchema.parse(await req.json());
  await requirePermission(userId, corporateOrgId, "CSR.Project.Write");

  if (input.status === "approved" && !(await can(userId, corporateOrgId, "CSR.Project.Approve"))) {
    return apiError(403, "Missing required permission: CSR.Project.Approve");
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  const setField = (column: string, value: unknown) => {
    values.push(value);
    fields.push(`${column} = $${values.length}`);
  };

  if (input.title !== undefined) setField("title", input.title);
  if (input.description !== undefined) setField("description", input.description);
  if (input.budgetAmount !== undefined) setField("budget_amount", input.budgetAmount);
  if (input.status !== undefined) setField("status", input.status);
  if (input.ngoProfileId !== undefined) setField("ngo_profile_id", input.ngoProfileId);
  if (input.startDate !== undefined) setField("start_date", input.startDate);
  if (input.endDate !== undefined) setField("end_date", input.endDate);

  if (fields.length === 0) return apiError(400, "No fields to update");

  values.push(id);
  const { rows } = await getPool().query(
    `UPDATE csr_projects SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING id, title, status`,
    values
  );

  return apiSuccess(rows[0]);
});
