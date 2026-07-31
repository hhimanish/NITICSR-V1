import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, paginationParams, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { CreatePolicySchema } from "@/lib/schemas-v1";
import { findUserByClerkId } from "@/lib/users-repo";

export const GET = withApiErrors(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { searchParams } = req.nextUrl;
  const organizationId = searchParams.get("organizationId");
  if (!organizationId) return apiError(400, "organizationId query param is required");

  await requirePermission(userId, organizationId, "Governance.Policy.Read");
  const { limit, offset } = paginationParams(searchParams);

  const { rows } = await getPool().query(
    `SELECT id, title, category, version, status, effective_date, review_date, created_at,
            (SELECT count(*)::int FROM policy_acknowledgements pa WHERE pa.policy_id = governance_policies.id) AS acknowledgement_count
       FROM governance_policies
      WHERE organization_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
    [organizationId, limit, offset]
  );

  return apiSuccess(rows, { limit, offset });
});

export const POST = withApiErrors(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const input = CreatePolicySchema.parse(await req.json());
  await requirePermission(userId, input.organizationId, "Governance.Policy.Write");

  const user = await findUserByClerkId(userId);

  const { rows } = await getPool().query(
    `INSERT INTO governance_policies (organization_id, title, category, content, effective_date, review_date, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, title, category, status, version`,
    [
      input.organizationId,
      input.title,
      input.category ?? "general",
      input.content,
      input.effectiveDate ?? null,
      input.reviewDate ?? null,
      user?.id ?? null,
    ]
  );

  return apiSuccess(rows[0]);
});
