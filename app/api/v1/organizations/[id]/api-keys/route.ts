import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { createApiKey, listApiKeys } from "@/lib/api-keys";
import { requirePermission } from "@/lib/rbac";
import { CreateApiKeySchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "Organization.Write");

  return apiSuccess(await listApiKeys(organizationId));
});

/** The raw key is returned exactly once, in this response — only its hash
 * is ever stored (see lib/api-keys.ts). */
export const POST = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "Organization.Write");

  const input = CreateApiKeySchema.parse(await req.json());
  return apiSuccess(await createApiKey(organizationId, input.name, userId));
});
