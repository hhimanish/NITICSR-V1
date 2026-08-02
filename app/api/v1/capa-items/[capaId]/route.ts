import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { UpdateCapaItemSchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ capaId: string }> };

export const PATCH = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { capaId } = await ctx.params;
  const pool = getPool();

  const { rows: capaRows } = await pool.query(`SELECT organization_id FROM capa_items WHERE id = $1`, [capaId]);
  if (capaRows.length === 0) return apiError(404, "CAPA item not found");
  await requirePermission(userId, capaRows[0].organization_id, "CSR.Project.Write");

  const input = UpdateCapaItemSchema.parse(await req.json());
  if (input.status === undefined) return apiError(400, "No fields to update");

  const { rows } = await pool.query(
    `UPDATE capa_items SET status = $1 WHERE id = $2 RETURNING id, title, status`,
    [input.status, capaId]
  );
  return apiSuccess(rows[0]);
});
