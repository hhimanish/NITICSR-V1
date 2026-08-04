import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { resolveCaller } from "@/lib/api-auth";
import { requirePermission } from "@/lib/rbac";
import { searchOrganization } from "@/lib/search";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * The one showcase endpoint retrofitted for API-key auth (ERT 12) —
 * proving the pattern works end to end rather than adding it to all 67
 * routes speculatively. A session caller still needs CSR.Project.Read; an
 * API-key caller's organization comes from the key itself and must match
 * the requested :id, or the key was issued to a different organization.
 */
export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { id: organizationId } = await ctx.params;

  const caller = await resolveCaller(req);
  if (!caller) return apiError(401, "Not authenticated");

  if (caller.type === "session") {
    await requirePermission(caller.clerkUserId, organizationId, "CSR.Project.Read");
  } else if (caller.organizationId !== organizationId) {
    return apiError(403, "API key is not valid for this organization");
  }

  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query) return apiError(400, "q query param is required");

  const results = await searchOrganization(organizationId, query);
  return apiSuccess(results);
});
