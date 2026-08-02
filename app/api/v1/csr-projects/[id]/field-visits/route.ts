import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { GEOFENCE_RADIUS_KM } from "@/lib/field-intelligence";
import { requirePermission } from "@/lib/rbac";
import { CreateFieldVisitSchema } from "@/lib/schemas-v1";
import { findUserByClerkId } from "@/lib/users-repo";

type RouteContext = { params: Promise<{ id: string }> };

async function loadProjectOrgId(projectId: string) {
  const { rows } = await getPool().query(
    `SELECT corporate_org_id FROM csr_projects WHERE id = $1 AND deleted_at IS NULL`,
    [projectId]
  );
  return rows[0]?.corporate_org_id ?? null;
}

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const corporateOrgId = await loadProjectOrgId(id);
  if (!corporateOrgId) return apiError(404, "Project not found");

  await requirePermission(userId, corporateOrgId, "CSR.Project.Read");

  const { rows } = await getPool().query(
    `SELECT fv.id, fv.latitude, fv.longitude, fv.distance_km, fv.within_geofence, fv.note, fv.created_at,
            u.full_name AS checked_in_by_name
       FROM field_visits fv
       LEFT JOIN users u ON u.id = fv.checked_in_by
      WHERE fv.csr_project_id = $1
      ORDER BY fv.created_at DESC`,
    [id]
  );
  return apiSuccess(rows);
});

// The same Haversine SQL expression used in app/api/v1/ngo-profiles and
// csr-projects (see ADR 0002) — reused inline rather than duplicated as a
// separate JS distance function, per that existing convention.
export const POST = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const corporateOrgId = await loadProjectOrgId(id);
  if (!corporateOrgId) return apiError(404, "Project not found");

  const input = CreateFieldVisitSchema.parse(await req.json());
  await requirePermission(userId, corporateOrgId, "CSR.Project.Write");

  const pool = getPool();
  const { rows: distanceRows } = await pool.query(
    `SELECT MIN(
       6371 * acos(least(1, greatest(-1,
         cos(radians($1)) * cos(radians(pl.latitude)) * cos(radians(pl.longitude) - radians($2))
         + sin(radians($1)) * sin(radians(pl.latitude))
       )))
     ) AS distance_km
       FROM project_locations pl
      WHERE pl.csr_project_id = $3 AND pl.latitude IS NOT NULL AND pl.longitude IS NOT NULL`,
    [input.latitude, input.longitude, id]
  );
  const distanceKm = distanceRows[0].distance_km !== null ? Number(distanceRows[0].distance_km) : null;
  const withinGeofence = distanceKm !== null ? distanceKm <= GEOFENCE_RADIUS_KM : null;

  const user = await findUserByClerkId(userId);
  const { rows } = await pool.query(
    `INSERT INTO field_visits
       (organization_id, csr_project_id, latitude, longitude, distance_km, within_geofence, note, checked_in_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, latitude, longitude, distance_km, within_geofence, note, created_at`,
    [corporateOrgId, id, input.latitude, input.longitude, distanceKm, withinGeofence, input.note ?? null, user?.id ?? null]
  );
  return apiSuccess(rows[0]);
});
