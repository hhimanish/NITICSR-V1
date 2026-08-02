import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { CreateIncidentSchema } from "@/lib/schemas-v1";
import { findUserByClerkId } from "@/lib/users-repo";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "CSR.Project.Read");

  const { rows } = await getPool().query(
    `SELECT id, category, severity, status, description, five_whys, created_at
       FROM incidents WHERE organization_id = $1
      ORDER BY CASE severity WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, created_at DESC`,
    [organizationId]
  );
  return apiSuccess(rows);
});

export const POST = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  const input = CreateIncidentSchema.parse(await req.json());
  await requirePermission(userId, organizationId, "CSR.Project.Write");

  const user = await findUserByClerkId(userId);
  const { rows } = await getPool().query(
    `INSERT INTO incidents (organization_id, csr_project_id, category, severity, description, five_whys, reported_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, category, severity, status, description, five_whys, created_at`,
    [
      organizationId,
      input.csrProjectId ?? null,
      input.category,
      input.severity ?? "medium",
      input.description,
      input.fiveWhys ?? null,
      user?.id ?? null,
    ]
  );
  return apiSuccess(rows[0]);
});
