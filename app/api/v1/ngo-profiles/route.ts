import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, paginationParams, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { hasAnyPermission } from "@/lib/rbac";

/** Cross-org NGO directory read — there's no single "acting organization"
 * for browsing NGOs, so access is granted if the caller holds
 * NGO.Profile.Read in any organization they belong to (see hasAnyPermission). */
export const GET = withApiErrors(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  if (!(await hasAnyPermission(userId, "NGO.Profile.Read"))) {
    return apiError(403, "Missing required permission: NGO.Profile.Read");
  }

  const { searchParams } = req.nextUrl;
  const { limit, offset } = paginationParams(searchParams);
  const state = searchParams.get("state");
  const causeCategoryKey = searchParams.get("causeCategoryKey");

  const lat = searchParams.get("lat") ? Number(searchParams.get("lat")) : null;
  const lng = searchParams.get("lng") ? Number(searchParams.get("lng")) : null;
  const radiusKm = searchParams.get("radiusKm") ? Number(searchParams.get("radiusKm")) : null;
  const hasNearFilter = lat !== null && lng !== null && radiusKm !== null;

  if ((lat !== null || lng !== null || radiusKm !== null) && !hasNearFilter) {
    return apiError(400, "lat, lng, and radiusKm must all be provided together");
  }
  if (hasNearFilter && (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(radiusKm) || radiusKm! <= 0)) {
    return apiError(400, "lat, lng, and radiusKm must be valid numbers, with radiusKm > 0");
  }

  // Found during manual QA (NITICSR-NGO-004): this directory returned every
  // profile regardless of verification status, contradicting the platform's
  // own "Trust by Design — every partner is verified before it's ever
  // recommended" claim and the empty-state copy below ("No verified NGO
  // profiles match yet"), which already assumed this filter existed.
  const conditions = [
    "np.deleted_at IS NULL",
    "EXISTS (SELECT 1 FROM verification_requests vr WHERE vr.ngo_profile_id = np.id AND vr.status = 'approved')",
  ];
  const params: unknown[] = [];

  if (state) {
    params.push(state);
    conditions.push(`$${params.length} = ANY(np.operating_states)`);
  }
  if (causeCategoryKey) {
    params.push(causeCategoryKey);
    conditions.push(
      `EXISTS (SELECT 1 FROM ngo_cause_areas nca JOIN csr_categories c ON c.id = nca.csr_category_id
                WHERE nca.ngo_profile_id = np.id AND c.key = $${params.length})`
    );
  }

  let distanceSelect = "";
  let orderBy = "np.created_at DESC";

  if (hasNearFilter) {
    params.push(lat, lng);
    const latParam = `$${params.length - 1}`;
    const lngParam = `$${params.length}`;

    const distanceExpr = `6371 * acos(least(1, greatest(-1,
        cos(radians(${latParam})) * cos(radians(np.latitude)) * cos(radians(np.longitude) - radians(${lngParam}))
        + sin(radians(${latParam})) * sin(radians(np.latitude))
      )))`;

    distanceSelect = `, ${distanceExpr} AS distance_km`;
    conditions.push(`np.latitude IS NOT NULL AND np.longitude IS NOT NULL`);

    params.push(radiusKm);
    conditions.push(`${distanceExpr} <= $${params.length}`);
    orderBy = "distance_km ASC";
  }

  params.push(limit, offset);

  const { rows } = await getPool().query(
    `SELECT np.id, np.legal_name, np.headquarters_state, np.operating_states, np.description
            ${distanceSelect}
       FROM ngo_profiles np
      WHERE ${conditions.join(" AND ")}
      ORDER BY ${orderBy}
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return apiSuccess(rows, { limit, offset });
});
