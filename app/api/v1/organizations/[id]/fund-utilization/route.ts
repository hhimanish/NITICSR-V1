import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { computeOrgFundUtilization, getFiscalYearLabel } from "@/lib/financial-operations";
import { requirePermission } from "@/lib/rbac";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "CSR.Project.Read");

  const fiscalYear = req.nextUrl.searchParams.get("fiscalYear") ?? getFiscalYearLabel(new Date());
  const utilization = await computeOrgFundUtilization(organizationId, fiscalYear);
  return apiSuccess(utilization);
});
