import { getPool } from "@/lib/db";
import { findUserByClerkId } from "@/lib/users-repo";

/**
 * Compliance as a cross-cutting capability: obligations and gap checks
 * attach to entities that already exist (csr_projects) instead of a
 * separate compliance domain. Two halves —
 *  - obligations: real regulatory filing/reporting deadlines, tracked in
 *    compliance_obligations and only closed by an explicit human act
 *    (someone actually filed the utilization certificate).
 *  - checks: deterministic, computed-on-read signals over data the
 *    platform already collects (SDGs, locations, beneficiaries, the
 *    governance decision log, NGO assignment). Not a generalized rules
 *    engine — there's no backlog of 5+ varying rules to justify one yet.
 */

export const OBLIGATION_TYPES = [
  "schedule_vii_classification",
  "utilization_reporting",
  "csr2_filing",
  "impact_documentation",
] as const;

export type ObligationType = (typeof OBLIGATION_TYPES)[number];

const OBLIGATION_DEFS: Record<ObligationType, { description: string; dueDays: number }> = {
  schedule_vii_classification: {
    description: "Confirm Schedule VII clause classification and SDG alignment are on file",
    dueDays: 0,
  },
  utilization_reporting: {
    description: "File the utilization certificate for funds disbursed to the implementing partner",
    dueDays: 90,
  },
  csr2_filing: {
    description: "Include this project in the company's Form CSR-2 annual filing",
    dueDays: 365,
  },
  impact_documentation: {
    description: "Record impact/outcome documentation for the project",
    dueDays: 180,
  },
};

/** Creates the standard obligation set for a project once it's approved.
 * Idempotent — safe to call again (e.g. if approved twice via a status
 * revert), does nothing for obligation types that already exist. */
export async function generateObligationsForProject(organizationId: string, projectId: string) {
  const today = new Date();
  for (const type of OBLIGATION_TYPES) {
    const def = OBLIGATION_DEFS[type];
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + def.dueDays);
    await getPool().query(
      `INSERT INTO compliance_obligations
         (organization_id, csr_project_id, obligation_type, description, due_date)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (csr_project_id, obligation_type) DO NOTHING`,
      [organizationId, projectId, type, def.description, dueDate.toISOString().slice(0, 10)]
    );
  }
}

export async function getObligationsForProject(projectId: string) {
  const { rows } = await getPool().query(
    `SELECT * FROM compliance_obligations WHERE csr_project_id = $1 ORDER BY due_date ASC`,
    [projectId]
  );
  return rows;
}

export async function satisfyObligation(
  obligationId: string,
  status: "satisfied" | "waived",
  decidedByClerkUserId: string
) {
  const user = await findUserByClerkId(decidedByClerkUserId);
  const { rows } = await getPool().query(
    `UPDATE compliance_obligations
        SET status = $1, satisfied_at = now(), satisfied_by = $2
      WHERE id = $3
      RETURNING *`,
    [status, user?.id ?? null, obligationId]
  );
  return rows[0] ?? null;
}

export type ComplianceCheck = {
  key: string;
  label: string;
  passed: boolean;
  severity: "high" | "medium" | "low";
};

export type ProjectComplianceInput = {
  hasSdgs: boolean;
  hasLocation: boolean;
  hasBeneficiaries: boolean;
  hasDecision: boolean;
  ngoAssigned: boolean;
};

export function getProjectComplianceChecks(input: ProjectComplianceInput): ComplianceCheck[] {
  return [
    {
      key: "ngo_partner_assigned",
      label: "Implementing NGO partner assigned",
      passed: input.ngoAssigned,
      severity: "high",
    },
    {
      key: "approval_decision_logged",
      label: "Approval decision logged in the governance record",
      passed: input.hasDecision,
      severity: "high",
    },
    {
      key: "schedule_vii_sdg_mapping",
      label: "SDG alignment recorded, substantiating the Schedule VII classification",
      passed: input.hasSdgs,
      severity: "high",
    },
    {
      key: "project_location",
      label: "Implementation location recorded",
      passed: input.hasLocation,
      severity: "medium",
    },
    {
      key: "beneficiary_data",
      label: "Beneficiary data recorded",
      passed: input.hasBeneficiaries,
      severity: "medium",
    },
  ];
}

const SEVERITY_WEIGHT: Record<ComplianceCheck["severity"], number> = { high: 3, medium: 2, low: 1 };

/** A single 0-100 score blending data-completeness checks with obligation
 * closure, weighted by severity — obligations count the same as a "high"
 * check since a missed regulatory filing is exactly that serious. */
export function getComplianceScore(
  checks: ComplianceCheck[],
  obligations: { status: string }[]
): number {
  const checkTotal = checks.reduce((sum, c) => sum + SEVERITY_WEIGHT[c.severity], 0);
  const checkEarned = checks.filter((c) => c.passed).reduce((sum, c) => sum + SEVERITY_WEIGHT[c.severity], 0);
  const obligationTotal = obligations.length * SEVERITY_WEIGHT.high;
  const obligationEarned = obligations.filter((o) => o.status !== "pending").length * SEVERITY_WEIGHT.high;

  const total = checkTotal + obligationTotal;
  if (total === 0) return 100;
  return Math.round(((checkEarned + obligationEarned) / total) * 100);
}

export type OrgComplianceSummary = {
  totalProjects: number;
  averageScore: number;
  projectsWithGaps: number;
  overdueObligations: number;
  obligationCounts: { pending: number; satisfied: number; waived: number };
};

/** Aggregates compliance across every non-draft project in an organization
 * — shared by the /compliance-summary API route and the AI Copilot's
 * context, so both answer from the exact same computation. */
export async function computeOrgComplianceSummary(organizationId: string): Promise<OrgComplianceSummary> {
  const pool = getPool();
  const [{ rows: projects }, { rows: obligations }] = await Promise.all([
    pool.query(
      `SELECT p.id, p.ngo_profile_id,
              EXISTS(SELECT 1 FROM project_sdgs ps WHERE ps.csr_project_id = p.id) AS has_sdgs,
              EXISTS(SELECT 1 FROM project_locations pl WHERE pl.csr_project_id = p.id) AS has_location,
              EXISTS(SELECT 1 FROM beneficiaries b WHERE b.csr_project_id = p.id) AS has_beneficiaries,
              EXISTS(
                SELECT 1 FROM governance_decisions gd
                 WHERE gd.entity_type = 'csr_project' AND gd.entity_id = p.id
              ) AS has_decision
         FROM csr_projects p
        WHERE p.corporate_org_id = $1 AND p.deleted_at IS NULL AND p.status != 'draft'`,
      [organizationId]
    ),
    pool.query(
      `SELECT csr_project_id, status, due_date FROM compliance_obligations WHERE organization_id = $1`,
      [organizationId]
    ),
  ]);

  const obligationsByProject = new Map<string, { status: string; due_date: string }[]>();
  for (const o of obligations) {
    const list = obligationsByProject.get(o.csr_project_id) ?? [];
    list.push(o);
    obligationsByProject.set(o.csr_project_id, list);
  }

  let scoreSum = 0;
  let projectsWithGaps = 0;
  for (const p of projects) {
    const checks = getProjectComplianceChecks({
      hasSdgs: p.has_sdgs,
      hasLocation: p.has_location,
      hasBeneficiaries: p.has_beneficiaries,
      hasDecision: p.has_decision,
      ngoAssigned: p.ngo_profile_id !== null,
    });
    const score = getComplianceScore(checks, obligationsByProject.get(p.id) ?? []);
    scoreSum += score;
    if (score < 100) projectsWithGaps += 1;
  }

  const today = new Date().toISOString().slice(0, 10);
  return {
    totalProjects: projects.length,
    averageScore: projects.length === 0 ? 100 : Math.round(scoreSum / projects.length),
    projectsWithGaps,
    overdueObligations: obligations.filter((o) => o.status === "pending" && o.due_date < today).length,
    obligationCounts: {
      pending: obligations.filter((o) => o.status === "pending").length,
      satisfied: obligations.filter((o) => o.status === "satisfied").length,
      waived: obligations.filter((o) => o.status === "waived").length,
    },
  };
}
