import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { ReviewUnspentTransferSchema } from "@/lib/schemas-v1";

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const input = ReviewUnspentTransferSchema.parse(await req.json());

  const { rows: existing } = await getPool().query(
    `SELECT organization_id FROM unspent_fund_transfers WHERE id = $1`,
    [id]
  );
  if (existing.length === 0) return apiError(404, "Unspent fund transfer not found");

  await requirePermission(userId, existing[0].organization_id, "CSR.Project.Write");

  const { rows } = await getPool().query(
    `UPDATE unspent_fund_transfers
        SET status = 'transferred', transferred_at = now(), transfer_reference = $1
      WHERE id = $2
      RETURNING id, unspent_amount, destination, due_date, status, transferred_at, transfer_reference`,
    [input.transferReference ?? null, id]
  );
  return apiSuccess(rows[0]);
});
