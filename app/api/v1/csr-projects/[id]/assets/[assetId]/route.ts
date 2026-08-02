import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { UpdateProjectAssetSchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ id: string; assetId: string }> };

export const PATCH = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id, assetId } = await ctx.params;
  const pool = getPool();

  const { rows: projectRows } = await pool.query(
    `SELECT corporate_org_id FROM csr_projects WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  if (projectRows.length === 0) return apiError(404, "Project not found");
  await requirePermission(userId, projectRows[0].corporate_org_id, "CSR.Project.Write");

  const input = UpdateProjectAssetSchema.parse(await req.json());
  const fields: string[] = [];
  const values: unknown[] = [];
  const setField = (column: string, value: unknown) => {
    values.push(value);
    fields.push(`${column} = $${values.length}`);
  };
  if (input.status !== undefined) setField("status", input.status);
  if (input.evidenceUrl !== undefined) setField("evidence_url", input.evidenceUrl);

  if (fields.length === 0) return apiError(400, "No fields to update");

  values.push(assetId, id);
  const { rows } = await pool.query(
    `UPDATE project_assets SET ${fields.join(", ")}
      WHERE id = $${values.length - 1} AND csr_project_id = $${values.length}
      RETURNING id, name, status, latitude, longitude, evidence_url`,
    values
  );
  if (rows.length === 0) return apiError(404, "Asset not found");
  return apiSuccess(rows[0]);
});
