import { getPool } from "@/lib/db";

/**
 * ESG & Sustainability (ERT 9) — real aggregation over data that already
 * exists (project_sdgs, beneficiaries, csr_categories), plus a static,
 * factual BRSR-principle cross-reference. Deliberately NOT a fabricated
 * "Sustainability Score" or "ESG Maturity Index" — no emissions, water,
 * waste, or stakeholder-survey data has ever been captured, so no such
 * composite is computed. See docs/ARCHITECTURE.md's ERT 9 section.
 */

export type SdgRollupEntry = {
  sdgId: number;
  name: string;
  colorHex: string;
  projectCount: number;
  totalBudget: number;
  totalBeneficiaries: number;
};

export async function computeSdgRollup(organizationId: string): Promise<SdgRollupEntry[]> {
  // project_sdgs is keyed (csr_project_id, sdg_id), so within one sdg's
  // group each matching project appears exactly once — safe to SUM
  // budget_amount directly without a DISTINCT that would wrongly dedupe
  // by value instead of by row.
  const { rows } = await getPool().query(
    `SELECT s.id, s.name, s.color_hex,
            COUNT(p.id) AS project_count,
            COALESCE(SUM(p.budget_amount), 0) AS total_budget,
            COALESCE(SUM(ben.beneficiary_total), 0) AS total_beneficiaries
       FROM sdgs s
       LEFT JOIN project_sdgs ps ON ps.sdg_id = s.id
       LEFT JOIN csr_projects p ON p.id = ps.csr_project_id AND p.corporate_org_id = $1 AND p.deleted_at IS NULL
       LEFT JOIN LATERAL (
         SELECT SUM(count_estimate) AS beneficiary_total FROM beneficiaries WHERE csr_project_id = p.id
       ) ben ON p.id IS NOT NULL
      GROUP BY s.id, s.name, s.color_hex
      ORDER BY s.id ASC`,
    [organizationId]
  );

  return rows.map((r) => ({
    sdgId: r.id,
    name: r.name,
    colorHex: r.color_hex,
    projectCount: Number(r.project_count),
    totalBudget: Number(r.total_budget),
    totalBeneficiaries: Number(r.total_beneficiaries),
  }));
}

export type SocialImpactEntry = { category: string; totalCount: number; projectCount: number };

export async function computeSocialImpactSummary(organizationId: string): Promise<SocialImpactEntry[]> {
  const { rows } = await getPool().query(
    `SELECT b.category, COALESCE(SUM(b.count_estimate), 0) AS total_count, COUNT(DISTINCT b.csr_project_id) AS project_count
       FROM beneficiaries b
       JOIN csr_projects p ON p.id = b.csr_project_id
      WHERE p.corporate_org_id = $1 AND p.deleted_at IS NULL
      GROUP BY b.category
      ORDER BY total_count DESC`,
    [organizationId]
  );
  return rows.map((r) => ({
    category: r.category,
    totalCount: Number(r.total_count),
    projectCount: Number(r.project_count),
  }));
}

/** SEBI's National Guidelines on Responsible Business Conduct (NGRBC) —
 * the 9 principles BRSR is structured around. Public, static, and
 * essentially permanent — same "seed-mirroring constant" pattern as
 * lib/csr-categories.ts. */
export const BRSR_PRINCIPLES = [
  { number: 1, title: "Ethics, Transparency and Accountability" },
  { number: 2, title: "Safety and Sustainability of Goods and Services" },
  { number: 3, title: "Employee Wellbeing" },
  { number: 4, title: "Stakeholder Responsiveness" },
  { number: 5, title: "Human Rights" },
  { number: 6, title: "Environment Protection and Restoration" },
  { number: 7, title: "Responsible Public and Regulatory Policy Advocacy" },
  { number: 8, title: "Inclusive Growth and Equitable Development" },
  { number: 9, title: "Responsible Consumer Value and Engagement" },
] as const;

/** An indicative CSR-category-to-BRSR-principle cross-reference for
 * disclosure preparation — not an official SEBI crosswalk, and clearly
 * labeled as such wherever it's shown. Most Schedule VII CSR activity
 * maps to Principle 8 (Inclusive Growth); environment-focused categories
 * map to Principle 6; gender equality ties most closely to Principle 5
 * (Human Rights) under NGRBC's framing. */
export const CSR_CATEGORY_TO_BRSR_PRINCIPLE: Record<string, number> = {
  education: 8,
  healthcare: 8,
  rural_development: 8,
  environment: 6,
  water_sanitation: 6,
  skill_development: 8,
  gender_equality: 5,
  disaster_relief: 8,
  arts_heritage: 8,
  poverty_hunger: 8,
};

export type BrsrCoverageEntry = { principleNumber: number; principleTitle: string; projectCount: number; totalBudget: number };

export async function computeBrsrCoverage(organizationId: string): Promise<BrsrCoverageEntry[]> {
  const { rows } = await getPool().query(
    `SELECT c.key, COUNT(p.id) AS project_count, COALESCE(SUM(p.budget_amount), 0) AS total_budget
       FROM csr_projects p
       JOIN csr_categories c ON c.id = p.csr_category_id
      WHERE p.corporate_org_id = $1 AND p.deleted_at IS NULL AND p.status != 'draft'
      GROUP BY c.key`,
    [organizationId]
  );

  const byPrinciple = new Map<number, { projectCount: number; totalBudget: number }>();
  for (const r of rows) {
    const principle = CSR_CATEGORY_TO_BRSR_PRINCIPLE[r.key];
    if (!principle) continue;
    const entry = byPrinciple.get(principle) ?? { projectCount: 0, totalBudget: 0 };
    entry.projectCount += Number(r.project_count);
    entry.totalBudget += Number(r.total_budget);
    byPrinciple.set(principle, entry);
  }

  return BRSR_PRINCIPLES.map((p) => ({
    principleNumber: p.number,
    principleTitle: p.title,
    projectCount: byPrinciple.get(p.number)?.projectCount ?? 0,
    totalBudget: byPrinciple.get(p.number)?.totalBudget ?? 0,
  }));
}
