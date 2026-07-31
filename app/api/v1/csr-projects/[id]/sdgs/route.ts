import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { SetProjectSdgsSchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ id: string }> };

/** Replaces the full SDG mapping for a project — same "set, don't append"
 * pattern as ngo_cause_areas in the ngo-profile route. */
export const PUT = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
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
  const input = SetProjectSdgsSchema.parse(await req.json());

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM project_sdgs WHERE csr_project_id = $1`, [id]);
    if (input.sdgIds.length > 0) {
      await client.query(
        `INSERT INTO project_sdgs (csr_project_id, sdg_id) SELECT $1, unnest($2::smallint[])`,
        [id, input.sdgIds]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return apiSuccess({ sdgIds: input.sdgIds });
});
