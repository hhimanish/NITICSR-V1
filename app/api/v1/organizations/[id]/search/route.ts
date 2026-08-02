import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { requirePermission } from "@/lib/rbac";
import { searchOrganization } from "@/lib/search";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "CSR.Project.Read");

  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query) return apiError(400, "q query param is required");

  const results = await searchOrganization(organizationId, query);
  return apiSuccess(results);
});
