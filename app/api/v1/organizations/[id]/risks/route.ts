import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { CreateOrgRiskSchema } from "@/lib/schemas-v1";
import { findUserByClerkId } from "@/lib/users-repo";

type RouteContext = { params: Promise<{ id: string }> };

/** The organization-wide risk register — project_risks (ERT 6) extended to
 * also hold entries with no project at all, per ERT 8. */
export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "CSR.Project.Read");

  const { rows } = await getPool().query(
    `SELECT pr.id, pr.entry_type, pr.title, pr.description, pr.severity, pr.status,
            pr.created_at, u.full_name AS owner_name, p.title AS project_title
       FROM project_risks pr
       LEFT JOIN users u ON u.id = pr.owner_user_id
       LEFT JOIN csr_projects p ON p.id = pr.csr_project_id
      WHERE pr.organization_id = $1
      ORDER BY CASE pr.severity WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, pr.created_at DESC`,
    [organizationId]
  );
  return apiSuccess(rows);
});

export const POST = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  const input = CreateOrgRiskSchema.parse(await req.json());
  await requirePermission(userId, organizationId, "CSR.Project.Write");

  if (input.csrProjectId) {
    const { rows } = await getPool().query(
      `SELECT 1 FROM csr_projects WHERE id = $1 AND corporate_org_id = $2 AND deleted_at IS NULL`,
      [input.csrProjectId, organizationId]
    );
    if (rows.length === 0) return apiError(400, "csrProjectId does not belong to this organization");
  }

  const user = await findUserByClerkId(userId);
  const { rows } = await getPool().query(
    `INSERT INTO project_risks (organization_id, csr_project_id, entry_type, title, description, severity, owner_user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, entry_type, title, description, severity, status, created_at`,
    [
      organizationId,
      input.csrProjectId ?? null,
      input.entryType,
      input.title,
      input.description ?? null,
      input.severity ?? "medium",
      user?.id ?? null,
    ]
  );
  return apiSuccess(rows[0]);
});
