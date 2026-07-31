import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { UpdateNgoProfileSchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "NGO.Profile.Read");

  const { rows } = await getPool().query(
    `SELECT p.*, COALESCE(array_agg(c.key) FILTER (WHERE c.key IS NOT NULL), '{}') AS cause_category_keys
       FROM ngo_profiles p
       LEFT JOIN ngo_cause_areas nca ON nca.ngo_profile_id = p.id
       LEFT JOIN csr_categories c ON c.id = nca.csr_category_id
      WHERE p.organization_id = $1 AND p.deleted_at IS NULL
      GROUP BY p.id`,
    [organizationId]
  );

  if (rows.length === 0) return apiError(404, "No NGO profile for this organization yet");
  return apiSuccess(rows[0]);
});

export const PATCH = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "NGO.Profile.Write");

  const input = UpdateNgoProfileSchema.parse(await req.json());

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const upsertResult = await client.query(
      `INSERT INTO ngo_profiles (
         organization_id, legal_name, registration_number, registration_type,
         pan, established_year, description, website, headquarters_state, operating_states
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (organization_id) DO UPDATE SET
         legal_name = EXCLUDED.legal_name,
         registration_number = COALESCE(EXCLUDED.registration_number, ngo_profiles.registration_number),
         registration_type = COALESCE(EXCLUDED.registration_type, ngo_profiles.registration_type),
         pan = COALESCE(EXCLUDED.pan, ngo_profiles.pan),
         established_year = COALESCE(EXCLUDED.established_year, ngo_profiles.established_year),
         description = COALESCE(EXCLUDED.description, ngo_profiles.description),
         website = COALESCE(EXCLUDED.website, ngo_profiles.website),
         headquarters_state = COALESCE(EXCLUDED.headquarters_state, ngo_profiles.headquarters_state),
         operating_states = COALESCE(EXCLUDED.operating_states, ngo_profiles.operating_states)
       RETURNING id`,
      [
        organizationId,
        input.legalName,
        input.registrationNumber ?? null,
        input.registrationType ?? null,
        input.pan ?? null,
        input.establishedYear ?? null,
        input.description ?? null,
        input.website || null,
        input.headquartersState ?? null,
        input.operatingStates ?? null,
      ]
    );
    const ngoProfileId = upsertResult.rows[0].id;

    if (input.causeCategoryKeys) {
      await client.query(`DELETE FROM ngo_cause_areas WHERE ngo_profile_id = $1`, [ngoProfileId]);
      if (input.causeCategoryKeys.length > 0) {
        await client.query(
          `INSERT INTO ngo_cause_areas (ngo_profile_id, csr_category_id)
             SELECT $1, id FROM csr_categories WHERE key = ANY($2::text[])`,
          [ngoProfileId, input.causeCategoryKeys]
        );
      }
    }

    await client.query("COMMIT");
    return apiSuccess({ id: ngoProfileId });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
