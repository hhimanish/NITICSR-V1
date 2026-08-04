import { getPool } from "@/lib/db";

/**
 * Platform-wide Open Data (ERT 12) — totals only, across every
 * organization, never a per-organization breakdown. Safe to publish
 * without any opt-in gate because no single tenant is identifiable from a
 * sum. Deliberately framed as "NITICSR platform impact," never a
 * "National CSR Index" — this platform's registered-org base doesn't
 * come close to national coverage, and implying otherwise would repeat
 * the exact fabrication ERT 9 refused for a Sustainability Score.
 */
export type PlatformImpactSummary = {
  totalCorporateOrganizations: number;
  totalVerifiedNgos: number;
  totalCsrProjects: number;
  totalCompletedProjects: number;
  totalBeneficiariesReached: number;
  totalFundsDisbursed: number;
  sdgGoalsCovered: number;
  generatedAt: string;
};

export async function computePlatformImpactSummary(): Promise<PlatformImpactSummary> {
  const pool = getPool();

  const [orgCounts, ngoCount, projectCounts, beneficiaryTotal, disbursedTotal, sdgCount] = await Promise.all([
    pool.query(
      `SELECT type, count(*) AS n FROM organizations WHERE deleted_at IS NULL GROUP BY type`
    ),
    pool.query(
      `SELECT count(DISTINCT ngo_profile_id) AS n
         FROM verification_requests WHERE status = 'approved'`
    ),
    pool.query(
      `SELECT count(*) AS total, count(*) FILTER (WHERE status = 'completed') AS completed
         FROM csr_projects WHERE deleted_at IS NULL AND status != 'draft'`
    ),
    pool.query(`SELECT coalesce(sum(count_estimate), 0) AS n FROM beneficiaries`),
    pool.query(`SELECT coalesce(sum(amount), 0) AS n FROM disbursements`),
    pool.query(`SELECT count(DISTINCT sdg_id) AS n FROM project_sdgs`),
  ]);

  const corporateRow = orgCounts.rows.find((r) => r.type === "corporate");

  return {
    totalCorporateOrganizations: Number(corporateRow?.n ?? 0),
    totalVerifiedNgos: Number(ngoCount.rows[0].n),
    totalCsrProjects: Number(projectCounts.rows[0].total),
    totalCompletedProjects: Number(projectCounts.rows[0].completed),
    totalBeneficiariesReached: Number(beneficiaryTotal.rows[0].n),
    totalFundsDisbursed: Number(disbursedTotal.rows[0].n),
    sdgGoalsCovered: Number(sdgCount.rows[0].n),
    generatedAt: new Date().toISOString(),
  };
}
