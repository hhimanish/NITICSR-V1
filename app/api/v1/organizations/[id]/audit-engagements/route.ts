import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { CreateAuditEngagementSchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "CSR.Project.Read");

  const { rows } = await getPool().query(
    `SELECT id, title, scope, status, start_date, end_date, created_at
       FROM audit_engagements WHERE organization_id = $1 ORDER BY created_at DESC`,
    [organizationId]
  );
  return apiSuccess(rows);
});

export const POST = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  const input = CreateAuditEngagementSchema.parse(await req.json());
  await requirePermission(userId, organizationId, "CSR.Project.Write");

  const { rows } = await getPool().query(
    `INSERT INTO audit_engagements (organization_id, title, scope, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, title, scope, status, start_date, end_date, created_at`,
    [organizationId, input.title, input.scope ?? null, input.startDate ?? null, input.endDate ?? null]
  );
  return apiSuccess(rows[0]);
});
