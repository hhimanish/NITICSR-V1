import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { requirePermission } from "@/lib/rbac";
import { CreateWebhookSchema } from "@/lib/schemas-v1";
import { createWebhook, listWebhooks } from "@/lib/webhooks";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "Organization.Write");

  return apiSuccess(await listWebhooks(organizationId));
});

/** The signing secret is returned exactly once, in this response — used
 * to verify the `X-NITICSR-Signature` header on every delivery (see
 * lib/webhooks.ts's deliverWebhookJobHandler). */
export const POST = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "Organization.Write");

  const input = CreateWebhookSchema.parse(await req.json());
  return apiSuccess(await createWebhook(organizationId, input.url, input.eventTypes));
});
