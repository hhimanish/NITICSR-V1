import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, withApiErrors } from "@/lib/api-utils";
import { getComplianceScore, getObligationsForProject, getProjectComplianceChecks } from "@/lib/compliance";
import { getPool } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiErrors(async (req: NextRequest, ctx: RouteContext) => {
  const { userId } = await auth();
  if (!userId) return apiError(401, "Not authenticated");

  const { id } = await ctx.params;
  const pool = getPool();

  const { rows: projectRows } = await pool.query(
    `SELECT corporate_org_id, ngo_profile_id FROM csr_projects WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  if (projectRows.length === 0) return apiError(404, "Project not found");
  const { corporate_org_id: corporateOrgId, ngo_profile_id: ngoProfileId } = projectRows[0];

  await requirePermission(userId, corporateOrgId, "CSR.Project.Read");

  const [{ rows: sdgRows }, { rows: locationRows }, { rows: beneficiaryRows }, { rows: decisionRows }, obligations] =
    await Promise.all([
      pool.query(`SELECT 1 FROM project_sdgs WHERE csr_project_id = $1 LIMIT 1`, [id]),
      pool.query(`SELECT 1 FROM project_locations WHERE csr_project_id = $1 LIMIT 1`, [id]),
      pool.query(`SELECT 1 FROM beneficiaries WHERE csr_project_id = $1 LIMIT 1`, [id]),
      pool.query(
        `SELECT 1 FROM governance_decisions WHERE entity_type = 'csr_project' AND entity_id = $1 LIMIT 1`,
        [id]
      ),
      getObligationsForProject(id),
    ]);

  const checks = getProjectComplianceChecks({
    hasSdgs: sdgRows.length > 0,
    hasLocation: locationRows.length > 0,
    hasBeneficiaries: beneficiaryRows.length > 0,
    hasDecision: decisionRows.length > 0,
    ngoAssigned: ngoProfileId !== null,
  });
  const score = getComplianceScore(checks, obligations);

  return apiSuccess({ checks, obligations, score });
});
