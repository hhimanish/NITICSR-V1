import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { requirePermission } from "@/lib/rbac";

export const GET = withApiErrors(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { searchParams } = req.nextUrl;
  const key = searchParams.get("key");
  const organizationId = searchParams.get("organizationId");
  if (!key || !organizationId) return apiError(400, "key and organizationId query params are required");

  // Membership check only — reading a flag isn't a privileged action.
  await requirePermission(userId, organizationId, "Organization.Read");

  return apiSuccess({ key, enabled: await isFeatureEnabled(key, organizationId) });
});
