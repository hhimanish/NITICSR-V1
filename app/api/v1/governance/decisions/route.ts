import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, paginationParams, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

/** Read-only view over the immutable governance_decisions log — see
 * lib/governance.ts for what writes to it. */
export const GET = withApiErrors(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { searchParams } = req.nextUrl;
  const organizationId = searchParams.get("organizationId");
  if (!organizationId) return apiError(400, "organizationId query param is required");

  await requirePermission(userId, organizationId, "Governance.Decision.Read");

  const { limit, offset } = paginationParams(searchParams);
  const { rows } = await getPool().query(
    `SELECT gd.id, gd.decision_type, gd.entity_type, gd.entity_id, gd.rationale, gd.created_at,
            u.full_name AS decided_by_name, u.email AS decided_by_email
       FROM governance_decisions gd
       LEFT JOIN users u ON u.id = gd.decided_by
      WHERE gd.organization_id = $1
      ORDER BY gd.created_at DESC
      LIMIT $2 OFFSET $3`,
    [organizationId, limit, offset]
  );

  return apiSuccess(rows, { limit, offset });
});
