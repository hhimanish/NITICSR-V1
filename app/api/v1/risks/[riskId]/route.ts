import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { UpdateProjectRiskSchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ riskId: string }> };

/** Works for both project-scoped and organization-wide risk register
 * entries — resolves the organization directly from the risk row rather
 * than through a project, since a risk may not have one. */
export const PATCH = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { riskId } = await ctx.params;
  const pool = getPool();

  const { rows: riskRows } = await pool.query(`SELECT organization_id FROM project_risks WHERE id = $1`, [riskId]);
  if (riskRows.length === 0) return apiError(404, "Risk/issue not found");
  await requirePermission(userId, riskRows[0].organization_id, "CSR.Project.Write");

  const input = UpdateProjectRiskSchema.parse(await req.json());
  const fields: string[] = [];
  const values: unknown[] = [];
  const setField = (column: string, value: unknown) => {
    values.push(value);
    fields.push(`${column} = $${values.length}`);
  };
  if (input.status !== undefined) setField("status", input.status);
  if (input.severity !== undefined) setField("severity", input.severity);

  if (fields.length === 0) return apiError(400, "No fields to update");

  values.push(riskId);
  const { rows } = await pool.query(
    `UPDATE project_risks SET ${fields.join(", ")} WHERE id = $${values.length}
     RETURNING id, entry_type, title, description, severity, status`,
    values
  );
  return apiSuccess(rows[0]);
});
