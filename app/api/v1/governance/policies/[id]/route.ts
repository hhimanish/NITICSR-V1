import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { UpdatePolicySchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ id: string }> };

async function loadPolicyOrgId(policyId: string) {
  const { rows } = await getPool().query(`SELECT organization_id FROM governance_policies WHERE id = $1`, [
    policyId,
  ]);
  return rows[0]?.organization_id ?? null;
}

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const organizationId = await loadPolicyOrgId(id);
  if (!organizationId) return apiError(404, "Policy not found");

  await requirePermission(userId, organizationId, "Governance.Policy.Read");

  const { rows } = await getPool().query(`SELECT * FROM governance_policies WHERE id = $1`, [id]);
  return apiSuccess(rows[0]);
});

export const PATCH = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const organizationId = await loadPolicyOrgId(id);
  if (!organizationId) return apiError(404, "Policy not found");

  await requirePermission(userId, organizationId, "Governance.Policy.Write");
  const input = UpdatePolicySchema.parse(await req.json());

  const fields: string[] = [];
  const values: unknown[] = [];
  const setField = (column: string, value: unknown) => {
    values.push(value);
    fields.push(`${column} = $${values.length}`);
  };

  if (input.title !== undefined) setField("title", input.title);
  if (input.category !== undefined) setField("category", input.category);
  if (input.status !== undefined) setField("status", input.status);
  if (input.effectiveDate !== undefined) setField("effective_date", input.effectiveDate);
  if (input.reviewDate !== undefined) setField("review_date", input.reviewDate);
  if (input.content !== undefined) {
    setField("content", input.content);
    fields.push("version = version + 1");
  }

  if (fields.length === 0) return apiError(400, "No fields to update");

  values.push(id);
  const { rows } = await getPool().query(
    `UPDATE governance_policies SET ${fields.join(", ")} WHERE id = $${values.length}
     RETURNING id, title, category, status, version`,
    values
  );

  return apiSuccess(rows[0]);
});
