import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { queueNotification } from "@/lib/notifications";
import { requirePermission } from "@/lib/rbac";
import { ReviewVerificationRequestSchema } from "@/lib/schemas-v1";
import { findUserByClerkId } from "@/lib/users-repo";

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const input = ReviewVerificationRequestSchema.parse(await req.json());

  const permission = input.status === "in_review" ? "Verification.Review" : "Verification.Approve";
  await requirePermission(userId, input.organizationId, permission);

  const user = await findUserByClerkId(userId);
  const pool = getPool();

  const { rows } = await pool.query(
    `UPDATE verification_requests
        SET status = $1,
            review_notes = COALESCE($2, review_notes),
            reviewed_by = $3,
            reviewed_at = now()
      WHERE id = $4
      RETURNING id, status, reviewed_at, review_notes, ngo_profile_id, requested_by`,
    [input.status, input.reviewNotes ?? null, user?.id ?? null, id]
  );

  if (rows.length === 0) return apiError(404, "Verification request not found");
  const updated = rows[0];

  if (updated.status !== "in_review") {
    const { rows: notifyRows } = await pool.query(
      `SELECT u.id, u.email, np.legal_name
         FROM users u, ngo_profiles np
        WHERE u.id = $1 AND np.id = $2`,
      [updated.requested_by, updated.ngo_profile_id]
    );
    if (notifyRows[0]?.email) {
      await queueNotification({
        recipientUserId: notifyRows[0].id,
        recipientEmail: notifyRows[0].email,
        templateKey: "verification_reviewed",
        payload: { ngoName: notifyRows[0].legal_name, status: updated.status, reviewNotes: input.reviewNotes },
      });
    }
  }

  return apiSuccess({
    id: updated.id,
    status: updated.status,
    reviewedAt: updated.reviewed_at,
    reviewNotes: updated.review_notes,
  });
});
