import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, paginationParams, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { queueNotification } from "@/lib/notifications";
import { requirePermission } from "@/lib/rbac";
import { CreateVerificationRequestSchema } from "@/lib/schemas-v1";
import { findUserByClerkId } from "@/lib/users-repo";

export const GET = withApiErrors(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { searchParams } = req.nextUrl;
  const organizationId = searchParams.get("organizationId");
  if (!organizationId) return apiError(400, "organizationId query param is required");

  const pool = getPool();
  const { rows: orgRows } = await pool.query(`SELECT type FROM organizations WHERE id = $1`, [
    organizationId,
  ]);
  if (orgRows.length === 0) return apiError(404, "Organization not found");

  const { limit, offset } = paginationParams(searchParams);
  const isAuditor = orgRows[0].type === "auditor";

  await requirePermission(userId, organizationId, isAuditor ? "Verification.Review" : "NGO.Profile.Read");

  const status = searchParams.get("status");
  const conditions = isAuditor ? ["1 = 1"] : ["np.organization_id = $1"];
  const params: unknown[] = isAuditor ? [] : [organizationId];

  if (status) {
    params.push(status);
    conditions.push(`vr.status = $${params.length}`);
  }
  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT vr.id, vr.status, vr.reviewed_at, vr.review_notes, vr.created_at,
            np.id AS ngo_profile_id, np.legal_name AS ngo_name
       FROM verification_requests vr
       JOIN ngo_profiles np ON np.id = vr.ngo_profile_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY vr.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return apiSuccess(rows, { limit, offset });
});

export const POST = withApiErrors(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const input = CreateVerificationRequestSchema.parse(await req.json());
  await requirePermission(userId, input.organizationId, "Verification.Submit");

  const pool = getPool();
  const { rows: profileRows } = await pool.query(
    `SELECT id, legal_name FROM ngo_profiles WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
    [input.ngoProfileId, input.organizationId]
  );
  if (profileRows.length === 0) {
    return apiError(400, "ngoProfileId does not belong to organizationId");
  }

  const user = await findUserByClerkId(userId);

  const { rows } = await pool.query(
    `INSERT INTO verification_requests (ngo_profile_id, requested_by) VALUES ($1, $2)
     RETURNING id, status, created_at`,
    [input.ngoProfileId, user?.id ?? null]
  );

  if (user?.email) {
    await queueNotification({
      recipientUserId: user.id,
      recipientEmail: user.email,
      templateKey: "verification_submitted",
      payload: { ngoName: profileRows[0].legal_name },
    });
  }

  return apiSuccess(rows[0]);
});
