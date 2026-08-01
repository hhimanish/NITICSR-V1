import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { computeNgoPartnershipStats, recomputeNgoTrustScore } from "@/lib/ngo-intelligence";
import { hasAnyPermission } from "@/lib/rbac";

type RouteContext = { params: Promise<{ id: string }> };

/** The NGO 360 view — everything real that's known about one NGO in one
 * place: identity, documents, verification breakdown, aggregate (not
 * per-project) partnership history, and an honestly-computed trust score.
 * Cross-tenant read, same permission model as the directory list. */
export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  if (!(await hasAnyPermission(userId, "NGO.Profile.Read"))) {
    return apiError(403, "Missing required permission: NGO.Profile.Read");
  }

  const { id } = await ctx.params;
  const pool = getPool();

  const { rows: profileRows } = await pool.query(
    `SELECT p.id, p.legal_name, p.registration_number, p.registration_type, p.pan,
            p.established_year, p.description, p.website, p.headquarters_state, p.operating_states,
            COALESCE(array_agg(c.key) FILTER (WHERE c.key IS NOT NULL), '{}') AS cause_category_keys
       FROM ngo_profiles p
       LEFT JOIN ngo_cause_areas nca ON nca.ngo_profile_id = p.id
       LEFT JOIN csr_categories c ON c.id = nca.csr_category_id
      WHERE p.id = $1 AND p.deleted_at IS NULL
      GROUP BY p.id`,
    [id]
  );
  if (profileRows.length === 0) return apiError(404, "NGO profile not found");

  const [{ rows: documents }, { rows: latestRequest }, trustScore, partnershipStats] = await Promise.all([
    pool.query(
      `SELECT id, document_type, status, issued_at, expires_at
         FROM ngo_documents WHERE ngo_profile_id = $1 ORDER BY document_type`,
      [id]
    ),
    pool.query(
      `SELECT id, status, reviewed_at FROM verification_requests
        WHERE ngo_profile_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [id]
    ),
    recomputeNgoTrustScore(id),
    computeNgoPartnershipStats(id),
  ]);

  let verificationChecks: unknown[] = [];
  if (latestRequest[0]) {
    const { rows } = await pool.query(
      `SELECT provider, status, checked_at, expires_at FROM verification_checks
        WHERE verification_request_id = $1 ORDER BY provider`,
      [latestRequest[0].id]
    );
    verificationChecks = rows;
  }

  return apiSuccess({
    ...profileRows[0],
    documents,
    verification: {
      requestStatus: latestRequest[0]?.status ?? null,
      reviewedAt: latestRequest[0]?.reviewed_at ?? null,
      checks: verificationChecks,
    },
    trustScore,
    partnershipStats,
  });
});
