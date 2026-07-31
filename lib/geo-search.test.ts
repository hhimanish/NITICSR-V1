import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getPool } from "@/lib/db";

// Integration test — exercises the exact Haversine SQL expression used in
// app/api/v1/ngo-profiles/route.ts and app/api/v1/csr-projects/route.ts,
// against a real Postgres. Skips gracefully without DATABASE_URL.
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("Haversine radius search (integration)", () => {
  const suffix = Date.now().toString(36);
  // Mumbai (reference point), a "near" profile ~5km away, and a "far" one in Delhi.
  const origin = { lat: 19.076, lng: 72.8777 };
  const nearOrg = { slug: `geo-near-${suffix}`, lat: 19.11, lng: 72.9 };
  const farOrg = { slug: `geo-far-${suffix}`, lat: 28.7041, lng: 77.1025 };

  let nearOrgId: string;
  let farOrgId: string;

  beforeAll(async () => {
    const pool = getPool();

    for (const [label, org] of Object.entries({ near: nearOrg, far: farOrg })) {
      const orgResult = await pool.query(
        `INSERT INTO organizations (name, slug, type) VALUES ($1, $2, 'ngo') RETURNING id`,
        [`Geo Test ${label} ${suffix}`, org.slug]
      );
      const organizationId = orgResult.rows[0].id;
      await pool.query(
        `INSERT INTO ngo_profiles (organization_id, legal_name, latitude, longitude) VALUES ($1, $2, $3, $4)`,
        [organizationId, `Geo Test NGO ${label}`, org.lat, org.lng]
      );
      if (label === "near") nearOrgId = organizationId;
      else farOrgId = organizationId;
    }
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query(`DELETE FROM organizations WHERE id = ANY($1::uuid[])`, [[nearOrgId, farOrgId]]);
    await pool.end();
  });

  async function searchWithin(radiusKm: number) {
    const { rows } = await getPool().query(
      `SELECT np.legal_name,
              6371 * acos(least(1, greatest(-1,
                cos(radians($1)) * cos(radians(np.latitude)) * cos(radians(np.longitude) - radians($2))
                + sin(radians($1)) * sin(radians(np.latitude))
              ))) AS distance_km
         FROM ngo_profiles np
        WHERE np.organization_id = ANY($3::uuid[])
          AND 6371 * acos(least(1, greatest(-1,
                cos(radians($1)) * cos(radians(np.latitude)) * cos(radians(np.longitude) - radians($2))
                + sin(radians($1)) * sin(radians(np.latitude))
              ))) <= $4
        ORDER BY distance_km ASC`,
      [origin.lat, origin.lng, [nearOrgId, farOrgId], radiusKm]
    );
    return rows;
  }

  it("includes a profile within the radius and excludes one far outside it", async () => {
    const results = await searchWithin(10);
    expect(results).toHaveLength(1);
    expect(results[0].legal_name).toBe("Geo Test NGO near");
  });

  it("includes both when the radius is large enough", async () => {
    const results = await searchWithin(2000);
    expect(results.map((r) => r.legal_name)).toEqual(
      expect.arrayContaining(["Geo Test NGO near", "Geo Test NGO far"])
    );
  });

  it("orders results by distance ascending", async () => {
    const results = await searchWithin(2000);
    expect(Number(results[0].distance_km)).toBeLessThan(Number(results[1].distance_km));
  });
});
