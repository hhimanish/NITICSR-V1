import { getPool } from "@/lib/db";

/**
 * Grant Management OS (ERT 4) — extends the csr_projects lifecycle rather
 * than a parallel domain. Two honest computations, same discipline as
 * lib/compliance.ts and lib/ngo-intelligence.ts: a proposal readiness score
 * blended only from real signals (never a subjective reviewer-panel score —
 * no such committee exists to calibrate one against), and a disbursement
 * ledger that's explicitly bookkeeping, not real fund movement.
 */

export type ReadinessCheck = {
  key: string;
  label: string;
  passed: boolean;
  severity: "high" | "medium" | "low";
};

export type ProposalReadinessInput = {
  ngoAssigned: boolean;
  hasSdgs: boolean;
  hasLocation: boolean;
  hasBeneficiaries: boolean;
  hasMilestones: boolean;
};

export function getProposalReadinessChecks(input: ProposalReadinessInput): ReadinessCheck[] {
  return [
    { key: "ngo_assigned", label: "Implementing NGO assigned", passed: input.ngoAssigned, severity: "high" },
    { key: "milestones_defined", label: "Milestones defined", passed: input.hasMilestones, severity: "high" },
    { key: "sdg_alignment", label: "SDG alignment recorded", passed: input.hasSdgs, severity: "medium" },
    { key: "location_recorded", label: "Implementation location recorded", passed: input.hasLocation, severity: "medium" },
    { key: "beneficiaries_recorded", label: "Beneficiary data recorded", passed: input.hasBeneficiaries, severity: "medium" },
  ];
}

const SEVERITY_WEIGHT: Record<ReadinessCheck["severity"], number> = { high: 3, medium: 2, low: 1 };

export type ProposalScore = {
  score: number;
  readinessComponent: number;
  ngoTrustComponent: number | null;
  costPerBeneficiary: number | null;
};

/** Blends proposal readiness (always computable) with the NGO's trust score
 * (only if one exists yet — see lib/ngo-intelligence.ts) into a single 0-100
 * figure. Cost-per-beneficiary is returned alongside for a reviewer to judge
 * themselves — there is no platform-wide benchmark to score it against, so
 * it is never folded into the number itself. */
export function getProposalScore(
  checks: ReadinessCheck[],
  ngoTrustScore: number | null,
  budgetAmount: number | null,
  totalBeneficiaries: number | null
): ProposalScore {
  const total = checks.reduce((sum, c) => sum + SEVERITY_WEIGHT[c.severity], 0);
  const earned = checks.filter((c) => c.passed).reduce((sum, c) => sum + SEVERITY_WEIGHT[c.severity], 0);
  const readinessComponent = Math.round((earned / total) * 100);

  const parts = [readinessComponent, ngoTrustScore].filter((v): v is number => v !== null);
  const score = Math.round(parts.reduce((sum, v) => sum + v, 0) / parts.length);

  const costPerBeneficiary =
    budgetAmount && totalBeneficiaries && totalBeneficiaries > 0
      ? Math.round(budgetAmount / totalBeneficiaries)
      : null;

  return { score, readinessComponent, ngoTrustComponent: ngoTrustScore, costPerBeneficiary };
}

export type DisbursementSummary = {
  totalDisbursed: number;
  budgetAmount: number | null;
  remaining: number | null;
  percentUsed: number | null;
};

export async function getDisbursementSummary(
  csrProjectId: string,
  budgetAmount: number | null
): Promise<DisbursementSummary> {
  const { rows } = await getPool().query(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM disbursements WHERE csr_project_id = $1`,
    [csrProjectId]
  );
  const totalDisbursed = Number(rows[0].total);

  return {
    totalDisbursed,
    budgetAmount,
    remaining: budgetAmount !== null ? budgetAmount - totalDisbursed : null,
    percentUsed: budgetAmount && budgetAmount > 0 ? Math.round((totalDisbursed / budgetAmount) * 100) : null,
  };
}
