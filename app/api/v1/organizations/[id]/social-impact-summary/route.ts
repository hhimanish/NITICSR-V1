import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { computeBrsrCoverage, computeSocialImpactSummary } from "@/lib/esg";
import { requirePermission } from "@/lib/rbac";

type RouteContext = { params: Promise<{ id: string }> };

/** Returns beneficiary-category totals alongside the indicative BRSR
 * principle coverage — both real aggregations, no composite score. */
export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "CSR.Project.Read");

  const [socialImpact, brsrCoverage] = await Promise.all([
    computeSocialImpactSummary(organizationId),
    computeBrsrCoverage(organizationId),
  ]);
  return apiSuccess({ socialImpact, brsrCoverage });
});
