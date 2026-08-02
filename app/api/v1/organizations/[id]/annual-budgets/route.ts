import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { UpsertAnnualBudgetSchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "CSR.Project.Read");

  const { rows } = await getPool().query(
    `SELECT id, fiscal_year, budget_amount, created_at, updated_at
       FROM annual_csr_budgets WHERE organization_id = $1 ORDER BY fiscal_year DESC`,
    [organizationId]
  );
  return apiSuccess(rows);
});

export const POST = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "CSR.Project.Write");

  const input = UpsertAnnualBudgetSchema.parse(await req.json());
  const { rows } = await getPool().query(
    `INSERT INTO annual_csr_budgets (organization_id, fiscal_year, budget_amount)
     VALUES ($1, $2, $3)
     ON CONFLICT (organization_id, fiscal_year) DO UPDATE SET budget_amount = EXCLUDED.budget_amount
     RETURNING id, fiscal_year, budget_amount, created_at, updated_at`,
    [organizationId, input.fiscalYear, input.budgetAmount]
  );
  return apiSuccess(rows[0]);
});
