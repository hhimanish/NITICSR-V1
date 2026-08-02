import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getPool } from "@/lib/db";
import { getProposalReadinessChecks, getProposalScore } from "@/lib/grants";
import { recomputeNgoTrustScore } from "@/lib/ngo-intelligence";
import { requirePermission } from "@/lib/rbac";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const pool = getPool();

  const { rows: projectRows } = await pool.query(
    `SELECT corporate_org_id, ngo_profile_id, budget_amount FROM csr_projects
      WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  if (projectRows.length === 0) return apiError(404, "Project not found");
  const { corporate_org_id: corporateOrgId, ngo_profile_id: ngoProfileId, budget_amount: budgetAmount } =
    projectRows[0];

  await requirePermission(userId, corporateOrgId, "CSR.Project.Read");

  const [{ rows: sdgRows }, { rows: locationRows }, { rows: beneficiaryRows }, { rows: milestoneRows }] =
    await Promise.all([
      pool.query(`SELECT 1 FROM project_sdgs WHERE csr_project_id = $1 LIMIT 1`, [id]),
      pool.query(`SELECT 1 FROM project_locations WHERE csr_project_id = $1 LIMIT 1`, [id]),
      pool.query(`SELECT COALESCE(SUM(count_estimate), 0) AS total FROM beneficiaries WHERE csr_project_id = $1`, [
        id,
      ]),
      pool.query(`SELECT 1 FROM milestones WHERE csr_project_id = $1 LIMIT 1`, [id]),
    ]);

  const checks = getProposalReadinessChecks({
    ngoAssigned: ngoProfileId !== null,
    hasSdgs: sdgRows.length > 0,
    hasLocation: locationRows.length > 0,
    hasBeneficiaries: Number(beneficiaryRows[0].total) > 0,
    hasMilestones: milestoneRows.length > 0,
  });

  const ngoTrustScore = ngoProfileId ? (await recomputeNgoTrustScore(ngoProfileId))?.score ?? null : null;

  const result = getProposalScore(
    checks,
    ngoTrustScore,
    budgetAmount ? Number(budgetAmount) : null,
    Number(beneficiaryRows[0].total) || null
  );

  return apiSuccess({ ...result, checks });
});
