-- Financial Operations (ERT 5), scoped to what's real: an organization's
-- declared annual CSR budget, the Section 135(5)/(6) unspent-fund transfer
-- obligation (a capability the marketing site has described since Phase 3
-- but never actually built — see docs/ARCHITECTURE.md's ERT 5 section),
-- and expense categorization on the existing disbursement ledger.
-- Deliberately NOT payments/escrow (no processor), GL/ERP integration (no
-- vendor), treasury (no banking integration), or cost centers (no internal
-- department/business-unit data model exists to build them against).

-- A company must specifically designate a project "ongoing" (multi-year,
-- sanctioned in advance) in its board resolution — this isn't something
-- to infer from start/end dates, so it's a real, explicit declaration.
ALTER TABLE csr_projects
  ADD COLUMN IF NOT EXISTS is_ongoing_project BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS annual_csr_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  fiscal_year TEXT NOT NULL, -- e.g. '2025-26' (April-March)
  budget_amount NUMERIC(14, 2) NOT NULL CHECK (budget_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, fiscal_year)
);

DROP TRIGGER IF EXISTS trg_annual_csr_budgets_updated_at ON annual_csr_budgets;
CREATE TRIGGER trg_annual_csr_budgets_updated_at BEFORE UPDATE ON annual_csr_budgets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Section 135(5)/(6): unspent CSR amount on an ongoing project must move to
-- a special "Unspent CSR Account" within 30 days of the financial year end;
-- unspent on any other project must move to a Schedule VII fund within 6
-- months. Generated once, when a project completes with budget left
-- undisbursed — real math (budget_amount minus what's actually been
-- disbursed), never an estimate.
CREATE TABLE IF NOT EXISTS unspent_fund_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  csr_project_id UUID NOT NULL UNIQUE REFERENCES csr_projects(id) ON DELETE CASCADE,
  unspent_amount NUMERIC(14, 2) NOT NULL CHECK (unspent_amount > 0),
  destination TEXT NOT NULL CHECK (destination IN ('unspent_csr_account', 'schedule_vii_fund')),
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'transferred')),
  transferred_at TIMESTAMPTZ,
  transfer_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_unspent_fund_transfers_org ON unspent_fund_transfers (organization_id);
CREATE INDEX IF NOT EXISTS idx_unspent_fund_transfers_due ON unspent_fund_transfers (due_date) WHERE status = 'pending';

-- Expense categorization on the existing ledger — makes it audit-ready
-- without inventing an accounts-payable system (no vendor master, no
-- invoice upload; a vendor name and an invoice reference number are text,
-- same honesty level as milestones.evidence_url).
ALTER TABLE disbursements
  ADD COLUMN IF NOT EXISTS vendor_name TEXT,
  ADD COLUMN IF NOT EXISTS expense_category TEXT,
  ADD COLUMN IF NOT EXISTS invoice_reference TEXT;
