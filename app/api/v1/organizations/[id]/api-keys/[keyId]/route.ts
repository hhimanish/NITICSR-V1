import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { revokeApiKey } from "@/lib/api-keys";
import { requirePermission } from "@/lib/rbac";

type RouteContext = { params: Promise<{ id: string; keyId: string }> };

export const PATCH = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId, keyId } = await ctx.params;
  await requirePermission(userId, organizationId, "Organization.Write");

  const revoked = await revokeApiKey(keyId, organizationId);
  if (!revoked) return apiError(404, "API key not found or already revoked");
  return apiSuccess({ id: keyId, revoked: true });
});
