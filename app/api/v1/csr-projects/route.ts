import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, paginationParams, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { CreateCsrProjectSchema } from "@/lib/schemas-v1";

export const GET = withApiErrors(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { searchParams } = req.nextUrl;
  const organizationId = searchParams.get("organizationId");
  if (!organizationId) return apiError(400, "organizationId query param is required");

  await requirePermission(userId, organizationId, "CSR.Project.Read");

  const { limit, offset } = paginationParams(searchParams);
  const status = searchParams.get("status");
  const state = searchParams.get("state");
  const sort = searchParams.get("sort") === "oldest" ? "ASC" : "DESC";

  // Optional radius search: plain Haversine over project_locations.lat/lng.
  // No PostGIS needed at this scale — see docs/ARCHITECTURE.md's roadmap
  // notes on when that'd actually become worth adding.
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

  const pool = getPool();
  const { rows: orgRows } = await pool.query(`SELECT type FROM organizations WHERE id = $1`, [
    organizationId,
  ]);
  if (orgRows.length === 0) return apiError(404, "Organization not found");

  const isNgo = orgRows[0].type === "ngo";

  const conditions = [isNgo ? "np.organization_id = $1" : "p.corporate_org_id = $1"];
  const params: unknown[] = [organizationId];

  if (status) {
    params.push(status);
    conditions.push(`p.status = $${params.length}`);
  }
  if (state) {
    params.push(state);
    conditions.push(
      `EXISTS (SELECT 1 FROM project_locations pl WHERE pl.csr_project_id = p.id AND pl.state = $${params.length})`
    );
  }

  let distanceSelect = "";
  let orderBy = `p.created_at ${sort}`;

  if (hasNearFilter) {
    params.push(lat, lng);
    const latParam = `$${params.length - 1}`;
    const lngParam = `$${params.length}`;

    const distanceSubquery = `(SELECT MIN(
         6371 * acos(least(1, greatest(-1,
           cos(radians(${latParam})) * cos(radians(pl.latitude)) * cos(radians(pl.longitude) - radians(${lngParam}))
           + sin(radians(${latParam})) * sin(radians(pl.latitude))
         )))
       )
       FROM project_locations pl
       WHERE pl.csr_project_id = p.id)`;

    distanceSelect = `, ${distanceSubquery} AS distance_km`;

    params.push(radiusKm);
    conditions.push(`${distanceSubquery} <= $${params.length}`);
    orderBy = "distance_km ASC";
  }

  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT p.id, p.title, p.status, p.budget_amount, p.currency, p.start_date, p.end_date,
            p.corporate_org_id, p.ngo_profile_id, c.key AS csr_category_key, c.name AS csr_category_name
            ${distanceSelect}
       FROM csr_projects p
       JOIN csr_categories c ON c.id = p.csr_category_id
       LEFT JOIN ngo_profiles np ON np.id = p.ngo_profile_id
      WHERE p.deleted_at IS NULL AND ${conditions.join(" AND ")}
      ORDER BY ${orderBy}
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return apiSuccess(rows, { limit, offset });
});

export const POST = withApiErrors(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const input = CreateCsrProjectSchema.parse(await req.json());
  await requirePermission(userId, input.corporateOrgId, "CSR.Project.Write");

  const pool = getPool();
  const { rows: categoryRows } = await pool.query(`SELECT id FROM csr_categories WHERE key = $1`, [
    input.csrCategoryKey,
  ]);
  if (categoryRows.length === 0) return apiError(400, "Unknown csrCategoryKey");

  const { rows } = await pool.query(
    `INSERT INTO csr_projects (corporate_org_id, ngo_profile_id, csr_category_id, title, description, budget_amount, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, title, status, corporate_org_id, ngo_profile_id`,
    [
      input.corporateOrgId,
      input.ngoProfileId ?? null,
      categoryRows[0].id,
      input.title,
      input.description ?? null,
      input.budgetAmount ?? null,
      input.startDate ?? null,
      input.endDate ?? null,
    ]
  );

  return apiSuccess(rows[0]);
});
