import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { CreateProjectLocationSchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const pool = getPool();

  const { rows: projectRows } = await pool.query(
    `SELECT corporate_org_id FROM csr_projects WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  if (projectRows.length === 0) return apiError(404, "Project not found");

  await requirePermission(userId, projectRows[0].corporate_org_id, "CSR.Project.Write");
  const input = CreateProjectLocationSchema.parse(await req.json());

  const { rows } = await pool.query(
    `INSERT INTO project_locations (csr_project_id, state, district, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, state, district, latitude, longitude`,
    [id, input.state, input.district ?? null, input.latitude ?? null, input.longitude ?? null]
  );

  return apiSuccess(rows[0]);
});
