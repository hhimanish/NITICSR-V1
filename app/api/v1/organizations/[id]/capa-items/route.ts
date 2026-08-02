import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { CreateCapaItemSchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "CSR.Project.Read");

  const { rows } = await getPool().query(
    `SELECT c.id, c.title, c.description, c.due_date, c.status, c.created_at,
            u.full_name AS owner_name, ae.title AS audit_engagement_title
       FROM capa_items c
       LEFT JOIN users u ON u.id = c.owner_user_id
       LEFT JOIN audit_engagements ae ON ae.id = c.audit_engagement_id
      WHERE c.organization_id = $1
      ORDER BY c.due_date ASC NULLS LAST, c.created_at DESC`,
    [organizationId]
  );
  return apiSuccess(rows);
});

export const POST = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  const input = CreateCapaItemSchema.parse(await req.json());
  await requirePermission(userId, organizationId, "CSR.Project.Write");

  const { rows } = await getPool().query(
    `INSERT INTO capa_items (organization_id, audit_engagement_id, project_risk_id, title, description, due_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, title, description, due_date, status, created_at`,
    [
      organizationId,
      input.auditEngagementId ?? null,
      input.projectRiskId ?? null,
      input.title,
      input.description ?? null,
      input.dueDate ?? null,
    ]
  );
  return apiSuccess(rows[0]);
});
