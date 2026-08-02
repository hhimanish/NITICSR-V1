import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { UpdateIncidentSchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ incidentId: string }> };

export const PATCH = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { incidentId } = await ctx.params;
  const pool = getPool();

  const { rows: incidentRows } = await pool.query(`SELECT organization_id FROM incidents WHERE id = $1`, [
    incidentId,
  ]);
  if (incidentRows.length === 0) return apiError(404, "Incident not found");
  await requirePermission(userId, incidentRows[0].organization_id, "CSR.Project.Write");

  const input = UpdateIncidentSchema.parse(await req.json());
  const fields: string[] = [];
  const values: unknown[] = [];
  const setField = (column: string, value: unknown) => {
    values.push(value);
    fields.push(`${column} = $${values.length}`);
  };
  if (input.status !== undefined) setField("status", input.status);
  if (input.fiveWhys !== undefined) setField("five_whys", input.fiveWhys);

  if (fields.length === 0) return apiError(400, "No fields to update");

  values.push(incidentId);
  const { rows } = await pool.query(
    `UPDATE incidents SET ${fields.join(", ")} WHERE id = $${values.length}
     RETURNING id, category, severity, status, description, five_whys`,
    values
  );
  return apiSuccess(rows[0]);
});
