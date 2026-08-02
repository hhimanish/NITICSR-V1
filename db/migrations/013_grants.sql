-- Grant Management OS (ERT 4), scoped to what's real: extends the existing
-- csr_projects lifecycle rather than introducing a parallel "Grant" domain.
-- Deliberately NOT escrow (no payment processor integrated — disbursements
-- below are a bookkeeping ledger, not real money movement) and NOT a legal
-- e-signature (grant_agreements below record an acknowledgement, not a
-- signature) — see docs/ARCHITECTURE.md's ERT 4 section.

ALTER TABLE csr_projects
  ADD COLUMN IF NOT EXISTS renewed_from_project_id UUID REFERENCES csr_projects(id);

-- Structured pre-approval review notes. No reviewer-panel workflow (no
-- defined committee exists to model that on) — just a real record of who
-- reviewed a proposal and what they recommended, replacing an email thread.
CREATE TABLE IF NOT EXISTS proposal_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  csr_project_id UUID NOT NULL REFERENCES csr_projects(id) ON DELETE CASCADE,
  reviewed_by UUID REFERENCES users(id),
  recommendation TEXT NOT NULL CHECK (
    recommendation IN ('recommend', 'recommend_with_conditions', 'not_recommend')
  ),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposal_reviews_project ON proposal_reviews (csr_project_id);

-- A grant agreement's terms plus a timestamped acknowledgement from the
-- implementing NGO. Explicitly an acknowledgement, not an e-signature — no
-- e-sign vendor is integrated, so it isn't presented as legally binding.
CREATE TABLE IF NOT EXISTS grant_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  csr_project_id UUID NOT NULL UNIQUE REFERENCES csr_projects(id) ON DELETE CASCADE,
  terms TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_grant_agreements_updated_at ON grant_agreements;
CREATE TRIGGER trg_grant_agreements_updated_at BEFORE UPDATE ON grant_agreements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- A fund-utilization ledger: real bookkeeping records of amounts released
-- against a project's budget, optionally tied to a milestone. Not escrow —
-- no payment processor moves real money here, this is the record of intent
-- and utilization that CSR-2 reporting (see compliance_obligations) needs.
CREATE TABLE IF NOT EXISTS disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  csr_project_id UUID NOT NULL REFERENCES csr_projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  note TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disbursements_project ON disbursements (csr_project_id);
