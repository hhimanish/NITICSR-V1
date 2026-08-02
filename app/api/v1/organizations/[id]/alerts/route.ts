import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { computeControlAlerts } from "@/lib/assurance";
import { requirePermission } from "@/lib/rbac";

type RouteContext = { params: Promise<{ id: string }> };

/** Continuous Controls Monitoring feed — unifies checks that already
 * individually exist across compliance obligations, NGO document expiry,
 * unspent-fund transfers, field-visit geofencing, change-request
 * approvals, beneficiary records, and CAPA due dates, plus two honest
 * statistical checks. Computed fresh on every request — nothing persisted
 * or scored. */
export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "CSR.Project.Read");

  const alerts = await computeControlAlerts(organizationId);
  return apiSuccess(alerts);
});
