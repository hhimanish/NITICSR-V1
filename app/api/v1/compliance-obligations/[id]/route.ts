import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { satisfyObligation } from "@/lib/compliance";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { UpdateObligationSchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const input = UpdateObligationSchema.parse(await req.json());

  const { rows } = await getPool().query(
    `SELECT organization_id FROM compliance_obligations WHERE id = $1`,
    [id]
  );
  if (rows.length === 0) return apiError(404, "Obligation not found");

  await requirePermission(userId, rows[0].organization_id, "Compliance.Obligation.Write");

  const updated = await satisfyObligation(id, input.status, userId);
  if (!updated) return apiError(404, "Obligation not found");
  return apiSuccess(updated);
});
