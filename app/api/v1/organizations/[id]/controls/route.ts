import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { CreateControlSchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "CSR.Project.Read");

  const { rows } = await getPool().query(
    `SELECT c.id, c.name, c.description, c.control_type, c.frequency, c.created_at,
            u.full_name AS owner_name, pr.title AS linked_risk_title
       FROM controls c
       LEFT JOIN users u ON u.id = c.owner_user_id
       LEFT JOIN project_risks pr ON pr.id = c.linked_risk_id
      WHERE c.organization_id = $1
      ORDER BY c.created_at DESC`,
    [organizationId]
  );
  return apiSuccess(rows);
});

export const POST = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  const input = CreateControlSchema.parse(await req.json());
  await requirePermission(userId, organizationId, "CSR.Project.Write");

  const { rows } = await getPool().query(
    `INSERT INTO controls (organization_id, name, description, control_type, frequency, linked_risk_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, description, control_type, frequency, created_at`,
    [
      organizationId,
      input.name,
      input.description ?? null,
      input.controlType,
      input.frequency ?? "continuous",
      input.linkedRiskId ?? null,
    ]
  );
  return apiSuccess(rows[0]);
});
