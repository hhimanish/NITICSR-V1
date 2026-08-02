import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { CreateProjectAssetSchema } from "@/lib/schemas-v1";

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
    `SELECT id, name, status, latitude, longitude, evidence_url, created_at
       FROM project_assets WHERE csr_project_id = $1 ORDER BY created_at DESC`,
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

  const input = CreateProjectAssetSchema.parse(await req.json());
  await requirePermission(userId, corporateOrgId, "CSR.Project.Write");

  const { rows } = await getPool().query(
    `INSERT INTO project_assets (csr_project_id, name, latitude, longitude, evidence_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, status, latitude, longitude, evidence_url, created_at`,
    [id, input.name, input.latitude ?? null, input.longitude ?? null, input.evidenceUrl ?? null]
  );
  return apiSuccess(rows[0]);
});
