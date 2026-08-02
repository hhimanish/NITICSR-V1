import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { CreateProjectRiskSchema } from "@/lib/schemas-v1";
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
    `SELECT pr.id, pr.entry_type, pr.title, pr.description, pr.severity, pr.status,
            pr.created_at, u.full_name AS owner_name
       FROM project_risks pr
       LEFT JOIN users u ON u.id = pr.owner_user_id
      WHERE pr.csr_project_id = $1
      ORDER BY CASE pr.severity WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, pr.created_at DESC`,
    [id]
  );
  return apiSuccess(rows);
});

export const POST = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const corporateOrgId = await loadProjectOrgId(id);
  if (!corporateOrgId) return apiError(404, "Project not found");

  const input = CreateProjectRiskSchema.parse(await req.json());
  await requirePermission(userId, corporateOrgId, "CSR.Project.Write");

  const user = await findUserByClerkId(userId);
  const { rows } = await getPool().query(
    `INSERT INTO project_risks (csr_project_id, entry_type, title, description, severity, owner_user_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, entry_type, title, description, severity, status, created_at`,
    [id, input.entryType, input.title, input.description ?? null, input.severity ?? "medium", user?.id ?? null]
  );
  return apiSuccess(rows[0]);
});
