import { getPool } from "@/lib/db";

/**
 * Wires up the `ngo_trust_scores` table (unused schema since Phase 2 — see
 * db/migrations/004_ngo.sql) with only the components this platform can
 * honestly compute today: document/provider verification status and real
 * project completion history. `financial_component`, `governance_component`,
 * and `audit_component` stay NULL — there is no financial statement, board,
 * or independent-audit data anywhere in the system to compute them from, and
 * a fabricated number there would be actively misleading for a due-diligence
 * decision. The overall score only ever blends the components that exist.
 */

const REQUIRED_DOCUMENT_TYPES = ["12A", "80G", "FCRA", "CSR1", "PAN", "REGISTRATION_CERTIFICATE"] as const;

async function computeVerificationComponent(ngoProfileId: string): Promise<number | null> {
  const pool = getPool();

  const { rows: docRows } = await pool.query(
    `SELECT document_type FROM ngo_documents WHERE ngo_profile_id = $1 AND status = 'verified'`,
    [ngoProfileId]
  );
  const verifiedTypes = new Set(docRows.map((r) => r.document_type));
  const documentScore =
    (REQUIRED_DOCUMENT_TYPES.filter((t) => verifiedTypes.has(t)).length / REQUIRED_DOCUMENT_TYPES.length) * 100;

  const { rows: requestRows } = await pool.query(
    `SELECT id FROM verification_requests WHERE ngo_profile_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [ngoProfileId]
  );

  let providerScore: number | null = null;
  if (requestRows[0]) {
    const { rows: checkRows } = await pool.query(
      `SELECT status FROM verification_checks WHERE verification_request_id = $1`,
      [requestRows[0].id]
    );
    if (checkRows.length > 0) {
      providerScore = (checkRows.filter((c) => c.status === "passed").length / checkRows.length) * 100;
    }
  }

  // Both components are real signals but only present once something has
  // actually happened (a document uploaded, a verification requested) —
  // a brand-new profile with neither yields null, not a fabricated zero.
  if (docRows.length === 0 && providerScore === null) return null;
  const parts = [documentScore, providerScore].filter((v): v is number => v !== null);
  return Math.round(parts.reduce((sum, v) => sum + v, 0) / parts.length);
}

async function computeProjectSuccessComponent(ngoProfileId: string): Promise<number | null> {
  const { rows } = await getPool().query(
    `SELECT status FROM csr_projects
      WHERE ngo_profile_id = $1 AND deleted_at IS NULL AND status IN ('completed', 'cancelled')`,
    [ngoProfileId]
  );
  if (rows.length === 0) return null;
  const completed = rows.filter((r) => r.status === "completed").length;
  return Math.round((completed / rows.length) * 100);
}

export type NgoTrustScore = {
  score: number;
  verificationComponent: number | null;
  financialComponent: null;
  governanceComponent: null;
  auditComponent: null;
  projectSuccessComponent: number | null;
  notes: string;
  computedAt: string;
} | null;

/** Recomputes and persists the trust score for an NGO profile. Returns null
 * (and clears any stale row) when there isn't yet enough real activity —
 * neither a document/verification event nor a completed/cancelled project —
 * to compute anything honestly. */
export async function recomputeNgoTrustScore(ngoProfileId: string): Promise<NgoTrustScore> {
  const [verificationComponent, projectSuccessComponent] = await Promise.all([
    computeVerificationComponent(ngoProfileId),
    computeProjectSuccessComponent(ngoProfileId),
  ]);

  const available = [verificationComponent, projectSuccessComponent].filter(
    (v): v is number => v !== null
  );

  const pool = getPool();
  if (available.length === 0) {
    await pool.query(`DELETE FROM ngo_trust_scores WHERE ngo_profile_id = $1`, [ngoProfileId]);
    return null;
  }

  const score = Math.round(available.reduce((sum, v) => sum + v, 0) / available.length);
  const missing = [
    verificationComponent === null && "verification",
    projectSuccessComponent === null && "project track record",
    "financial health (no financial data submitted to the platform)",
    "governance (no board/leadership data model yet)",
    "independent audit (no separate audit trail beyond verification)",
  ].filter(Boolean);
  const notes = `Blended from available components only. Not yet scorable: ${missing.join(", ")}.`;

  const { rows } = await pool.query(
    `INSERT INTO ngo_trust_scores
       (ngo_profile_id, score, verification_component, financial_component,
        governance_component, audit_component, project_success_component, notes, computed_at)
     VALUES ($1, $2, $3, NULL, NULL, NULL, $4, $5, now())
     ON CONFLICT (ngo_profile_id) DO UPDATE SET
       score = EXCLUDED.score,
       verification_component = EXCLUDED.verification_component,
       financial_component = NULL,
       governance_component = NULL,
       audit_component = NULL,
       project_success_component = EXCLUDED.project_success_component,
       notes = EXCLUDED.notes,
       computed_at = now()
     RETURNING score, verification_component, project_success_component, notes, computed_at`,
    [ngoProfileId, score, verificationComponent, projectSuccessComponent, notes]
  );

  const row = rows[0];
  return {
    score: row.score,
    verificationComponent: row.verification_component,
    financialComponent: null,
    governanceComponent: null,
    auditComponent: null,
    projectSuccessComponent: row.project_success_component,
    notes: row.notes,
    computedAt: row.computed_at,
  };
}

export type NgoPartnershipStats = {
  totalCorporatePartners: number;
  totalProjects: number;
  projectsByStatus: Record<string, number>;
  totalFundingReceived: number;
};

/** Aggregate-only partnership history — deliberately never exposes another
 * corporate's specific project titles or budgets to a viewing corporate,
 * just totals, so cross-tenant due diligence can't leak a competitor's
 * CSR program details. */
export async function computeNgoPartnershipStats(ngoProfileId: string): Promise<NgoPartnershipStats> {
  const { rows } = await getPool().query(
    `SELECT corporate_org_id, status, budget_amount
       FROM csr_projects WHERE ngo_profile_id = $1 AND deleted_at IS NULL AND status != 'draft'`,
    [ngoProfileId]
  );

  const projectsByStatus: Record<string, number> = {};
  let totalFundingReceived = 0;
  for (const r of rows) {
    projectsByStatus[r.status] = (projectsByStatus[r.status] ?? 0) + 1;
    if (r.status === "active" || r.status === "completed") {
      totalFundingReceived += r.budget_amount ? Number(r.budget_amount) : 0;
    }
  }

  return {
    totalCorporatePartners: new Set(rows.map((r) => r.corporate_org_id)).size,
    totalProjects: rows.length,
    projectsByStatus,
    totalFundingReceived,
  };
}

export type PublicDirectoryEntry = {
  organizationId: string;
  ngoProfileId: string;
  legalName: string;
  description: string | null;
  headquartersState: string | null;
  operatingStates: string[];
};

/** Public, opt-in NGO directory (ERT 12) — only NGOs that have explicitly
 * flipped their `public_directory_opt_in` override on (default off, see
 * db/migrations/020_ecosystem.sql) AND have at least one approved
 * verification request. Opt-in because this reveals identity, unlike the
 * aggregate-only Open Data summary; the verification bar keeps the
 * directory from listing an unvetted profile just because it opted in. */
export async function listPublicDirectoryNgos(): Promise<PublicDirectoryEntry[]> {
  const { rows } = await getPool().query(
    `SELECT DISTINCT np.organization_id, np.id AS ngo_profile_id, np.legal_name,
            np.description, np.headquarters_state, np.operating_states
       FROM ngo_profiles np
       JOIN feature_flags ff ON ff.organization_id = np.organization_id
                             AND ff.key = 'public_directory_opt_in' AND ff.is_enabled
       JOIN verification_requests vr ON vr.ngo_profile_id = np.id AND vr.status = 'approved'
      WHERE np.deleted_at IS NULL
      ORDER BY np.legal_name`
  );

  return rows.map((r) => ({
    organizationId: r.organization_id,
    ngoProfileId: r.ngo_profile_id,
    legalName: r.legal_name,
    description: r.description,
    headquartersState: r.headquarters_state,
    operatingStates: r.operating_states,
  }));
}
