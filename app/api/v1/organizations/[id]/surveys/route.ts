import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { CreateSurveyDefinitionSchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "CSR.Project.Read");

  const { rows } = await getPool().query(
    `SELECT id, title, description, questions, created_at FROM survey_definitions
      WHERE organization_id = $1 ORDER BY created_at DESC`,
    [organizationId]
  );
  return apiSuccess(rows);
});

export const POST = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "CSR.Project.Write");

  const input = CreateSurveyDefinitionSchema.parse(await req.json());
  const { rows } = await getPool().query(
    `INSERT INTO survey_definitions (organization_id, title, description, questions)
     VALUES ($1, $2, $3, $4)
     RETURNING id, title, description, questions, created_at`,
    [organizationId, input.title, input.description ?? null, JSON.stringify(input.questions)]
  );
  return apiSuccess(rows[0]);
});
