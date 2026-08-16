import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, paginationParams, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { CreateOrganizationSchema } from "@/lib/schemas-v1";
import { getOrCreateUserFromClerk } from "@/lib/users-repo";

const DEFAULT_ROLE_BY_TYPE: Record<string, string> = {
  corporate: "corporate_admin",
  ngo: "ngo_admin",
  auditor: "auditor",
};

export const GET = withApiErrors(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { limit, offset } = paginationParams(req.nextUrl.searchParams);

  const { rows } = await getPool().query(
    `SELECT o.id, o.name, o.slug, o.type, r.key AS role, om.joined_at
       FROM organization_members om
       JOIN organizations o ON o.id = om.organization_id
       JOIN roles r ON r.id = om.role_id
       JOIN users u ON u.id = om.user_id
      WHERE u.clerk_user_id = $1 AND o.deleted_at IS NULL
      ORDER BY om.joined_at DESC
      LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return apiSuccess(rows, { limit, offset });
});

export const POST = withApiErrors(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const user = await getOrCreateUserFromClerk(userId);
  if (!user) {
    return apiError(409, "We couldn't verify your account email with Clerk — please try again in a moment.");
  }

  const input = CreateOrganizationSchema.parse(await req.json());
  const roleKey = DEFAULT_ROLE_BY_TYPE[input.type];

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const orgResult = await client.query(
      `INSERT INTO organizations (name, slug, type) VALUES ($1, $2, $3) RETURNING id, name, slug, type`,
      [input.name, input.slug, input.type]
    );
    const organization = orgResult.rows[0];

    const roleResult = await client.query(`SELECT id FROM roles WHERE key = $1`, [roleKey]);
    if (roleResult.rows.length === 0) throw new Error(`Missing seeded role: ${roleKey}`);

    await client.query(
      `INSERT INTO organization_members (organization_id, user_id, role_id) VALUES ($1, $2, $3)`,
      [organization.id, user.id, roleResult.rows[0].id]
    );

    await client.query("COMMIT");
    return apiSuccess(organization);
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error && "code" in error && (error as { code?: string }).code === "23505") {
      return apiError(409, "An organization with that slug already exists");
    }
    throw error;
  } finally {
    client.release();
  }
});
