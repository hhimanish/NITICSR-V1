import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { computeDisbursementForecast } from "@/lib/financial-operations";
import { requirePermission } from "@/lib/rbac";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const { rows } = await getPool().query(
    `SELECT corporate_org_id, budget_amount FROM csr_projects WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  if (rows.length === 0) return apiError(404, "Project not found");

  await requirePermission(userId, rows[0].corporate_org_id, "CSR.Project.Read");

  const forecast = await computeDisbursementForecast(
    id,
    rows[0].budget_amount ? Number(rows[0].budget_amount) : null
  );
  return apiSuccess(forecast);
});
