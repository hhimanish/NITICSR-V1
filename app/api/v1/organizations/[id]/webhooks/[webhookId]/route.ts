import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { requirePermission } from "@/lib/rbac";
import { revokeWebhook } from "@/lib/webhooks";

type RouteContext = { params: Promise<{ id: string; webhookId: string }> };

export const PATCH = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId, webhookId } = await ctx.params;
  await requirePermission(userId, organizationId, "Organization.Write");

  const revoked = await revokeWebhook(webhookId, organizationId);
  if (!revoked) return apiError(404, "Webhook not found or already inactive");
  return apiSuccess({ id: webhookId, isActive: false });
});
