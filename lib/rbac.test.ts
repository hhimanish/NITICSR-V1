import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getPool } from "@/lib/db";
import { can } from "@/lib/rbac";

// Integration test — needs a real Postgres with migrations applied
// (npm run db:migrate). Skips gracefully when DATABASE_URL isn't set, e.g.
// on a contributor's machine without a local Postgres. CI provides a
// Postgres service container — see .github/workflows/ci.yml.
const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)("rbac.can (integration)", () => {
  const suffix = Date.now().toString(36);
  const clerkUserId = `test_user_${suffix}`;
  const email = `rbac-test-${suffix}@example.com`;
  const orgSlug = `rbac-test-org-${suffix}`;
  let organizationId: string;
  let userId: string;

  beforeAll(async () => {
    const pool = getPool();

    const orgResult = await pool.query(
      `INSERT INTO organizations (name, slug, type) VALUES ($1, $2, 'corporate') RETURNING id`,
      [`RBAC Test Org ${suffix}`, orgSlug]
    );
    organizationId = orgResult.rows[0].id;

    const userResult = await pool.query(
      `INSERT INTO users (clerk_user_id, email) VALUES ($1, $2) RETURNING id`,
      [clerkUserId, email]
    );
    userId = userResult.rows[0].id;

    const roleResult = await pool.query(`SELECT id FROM roles WHERE key = 'csr_manager'`);
    await pool.query(
      `INSERT INTO organization_members (organization_id, user_id, role_id) VALUES ($1, $2, $3)`,
      [organizationId, userId, roleResult.rows[0].id]
    );
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.query(`DELETE FROM organizations WHERE id = $1`, [organizationId]); // cascades
    await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
    await pool.end();
  });

  it("grants a permission the csr_manager role has", async () => {
    expect(await can(clerkUserId, organizationId, "CSR.Project.Read")).toBe(true);
  });

  it("denies a permission the csr_manager role does not have", async () => {
    expect(await can(clerkUserId, organizationId, "Audit.Approve")).toBe(false);
  });

  it("denies access to an organization the user does not belong to", async () => {
    expect(
      await can(clerkUserId, "00000000-0000-0000-0000-000000000000", "CSR.Project.Read")
    ).toBe(false);
  });
});
