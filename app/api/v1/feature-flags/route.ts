import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import {
  isFeatureEnabled,
  listFeatureFlags,
  setGlobalFlagDefault,
  setOrganizationFlagOverride,
} from "@/lib/feature-flags";
import { requirePermission, hasAnyPermission } from "@/lib/rbac";
import { SetFeatureFlagSchema } from "@/lib/schemas-v1";

export const GET = withApiErrors(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { searchParams } = req.nextUrl;
  const key = searchParams.get("key");
  const organizationId = searchParams.get("organizationId");
  if (!organizationId) return apiError(400, "organizationId query param is required");

  // Membership check only — reading a flag isn't a privileged action.
  await requirePermission(userId, organizationId, "Organization.Read");

  if (key) {
    return apiSuccess({ key, enabled: await isFeatureEnabled(key, organizationId) });
  }
  return apiSuccess(await listFeatureFlags(organizationId));
});

/** Sets a flag's value. An org-scoped write (organizationId present) needs
 * Organization.Write on that org — the same permission that already governs
 * everything else about an organization's own settings. A global write
 * (organizationId omitted/null) needs Platform.FeatureFlag.Manage, checked
 * across any organization the caller belongs to, since it affects every
 * tenant without its own override. */
export const PATCH = withApiErrors(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const body = SetFeatureFlagSchema.parse(await req.json());

  if (body.organizationId) {
    await requirePermission(userId, body.organizationId, "Organization.Write");
    await setOrganizationFlagOverride(body.key, body.organizationId, body.isEnabled);
  } else {
    const allowed = await hasAnyPermission(userId, "Platform.FeatureFlag.Manage");
    if (!allowed) return apiError(403, "Missing required permission: Platform.FeatureFlag.Manage");
    await setGlobalFlagDefault(body.key, body.isEnabled, body.description);
  }

  return apiSuccess({ key: body.key, isEnabled: body.isEnabled });
});
