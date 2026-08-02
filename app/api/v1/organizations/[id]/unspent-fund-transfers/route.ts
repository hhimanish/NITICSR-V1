import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id: organizationId } = await ctx.params;
  await requirePermission(userId, organizationId, "CSR.Project.Read");

  const { rows } = await getPool().query(
    `SELECT uft.id, uft.unspent_amount, uft.destination, uft.due_date, uft.status,
            uft.transferred_at, uft.transfer_reference, p.title AS project_title
       FROM unspent_fund_transfers uft
       JOIN csr_projects p ON p.id = uft.csr_project_id
      WHERE uft.organization_id = $1
      ORDER BY uft.due_date ASC`,
    [organizationId]
  );
  return apiSuccess(rows);
});
