import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { UpdateControlSchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ controlId: string }> };

export const PATCH = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { controlId } = await ctx.params;
  const pool = getPool();

  const { rows: controlRows } = await pool.query(`SELECT organization_id FROM controls WHERE id = $1`, [controlId]);
  if (controlRows.length === 0) return apiError(404, "Control not found");
  await requirePermission(userId, controlRows[0].organization_id, "CSR.Project.Write");

  const input = UpdateControlSchema.parse(await req.json());
  if (input.frequency === undefined) return apiError(400, "No fields to update");

  const { rows } = await pool.query(
    `UPDATE controls SET frequency = $1 WHERE id = $2 RETURNING id, name, control_type, frequency`,
    [input.frequency, controlId]
  );
  return apiSuccess(rows[0]);
});
