import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { CreateChangeRequestSchema } from "@/lib/schemas-v1";
import { findUserByClerkId } from "@/lib/users-repo";

type RouteContext = { params: Promise<{ id: string }> };

const COLUMN_BY_FIELD: Record<string, string> = { budget_amount: "budget_amount", end_date: "end_date" };

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const pool = getPool();
  const { rows: projectRows } = await pool.query(
    `SELECT corporate_org_id FROM csr_projects WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  if (projectRows.length === 0) return apiError(404, "Project not found");
  await requirePermission(userId, projectRows[0].corporate_org_id, "CSR.Project.Read");

  const { rows } = await pool.query(
    `SELECT cr.id, cr.field, cr.current_value, cr.requested_value, cr.reason, cr.status,
            cr.decided_at, cr.created_at, u.full_name AS requested_by_name
       FROM change_requests cr
       LEFT JOIN users u ON u.id = cr.requested_by
      WHERE cr.csr_project_id = $1
      ORDER BY cr.created_at DESC`,
    [id]
  );
  return apiSuccess(rows);
});

export const POST = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const pool = getPool();
  const { rows: projectRows } = await pool.query(
    `SELECT corporate_org_id, budget_amount, end_date FROM csr_projects WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  if (projectRows.length === 0) return apiError(404, "Project not found");

  const input = CreateChangeRequestSchema.parse(await req.json());
  await requirePermission(userId, projectRows[0].corporate_org_id, "CSR.Project.Write");

  const column = COLUMN_BY_FIELD[input.field];
  const currentValue = projectRows[0][column];
  const user = await findUserByClerkId(userId);

  const { rows } = await pool.query(
    `INSERT INTO change_requests (csr_project_id, field, current_value, requested_value, reason, requested_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, field, current_value, requested_value, reason, status, created_at`,
    [id, input.field, String(currentValue ?? ""), input.requestedValue, input.reason ?? null, user?.id ?? null]
  );
  return apiSuccess(rows[0]);
});
