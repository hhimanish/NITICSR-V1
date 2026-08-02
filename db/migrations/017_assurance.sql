-- Risk, Audit & Assurance (ERT 8), scoped to what's real: unifying checks
-- that already exist scattered across ERT 2/3/5/6/7 into one continuous
-- controls feed, a real controls library, structured audit
-- engagements/CAPA tracking, and an incident log. Deliberately NOT an
-- Enterprise Trust Graph (no director/trustee/relationship data exists),
-- NOT quantified risk scoring or AI risk prediction (no calibration data
-- to ground either in — same discipline as ADR 0005's NGO trust-score
-- note), and NOT a full fraud platform (no photos/device data captured).
-- See docs/ARCHITECTURE.md's ERT 8 section.

-- project_risks (ERT 6) becomes the organization-wide risk register:
-- still linkable to a project, but no longer required to be.
ALTER TABLE project_risks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE project_risks pr
   SET organization_id = p.corporate_org_id
  FROM csr_projects p
 WHERE pr.csr_project_id = p.id AND pr.organization_id IS NULL;

ALTER TABLE project_risks ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE project_risks ALTER COLUMN csr_project_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_project_risks_org ON project_risks (organization_id);

-- A real, configurable catalog — not a fabricated maturity score.
CREATE TABLE IF NOT EXISTS controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  control_type TEXT NOT NULL CHECK (control_type IN ('preventive', 'detective', 'corrective')),
  frequency TEXT NOT NULL DEFAULT 'continuous' CHECK (
    frequency IN ('continuous', 'daily', 'weekly', 'monthly', 'quarterly', 'annual')
  ),
  owner_user_id UUID REFERENCES users(id),
  linked_risk_id UUID REFERENCES project_risks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_controls_org ON controls (organization_id);

DROP TRIGGER IF EXISTS trg_controls_updated_at ON controls;
CREATE TRIGGER trg_controls_updated_at BEFORE UPDATE ON controls
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Internal Audit Management, scoped to two levels (engagement +
-- corrective action) rather than three (engagement/finding/CAPA) — a
-- CAPA's title and description carry the finding itself; a separate
-- "finding" entity didn't add real capability at this stage.
CREATE TABLE IF NOT EXISTS audit_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scope TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_engagements_org ON audit_engagements (organization_id);

DROP TRIGGER IF EXISTS trg_audit_engagements_updated_at ON audit_engagements;
CREATE TRIGGER trg_audit_engagements_updated_at BEFORE UPDATE ON audit_engagements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS capa_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  audit_engagement_id UUID REFERENCES audit_engagements(id) ON DELETE SET NULL,
  project_risk_id UUID REFERENCES project_risks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  owner_user_id UUID REFERENCES users(id),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_capa_items_org ON capa_items (organization_id);
CREATE INDEX IF NOT EXISTS idx_capa_items_due ON capa_items (due_date) WHERE status != 'done';

DROP TRIGGER IF EXISTS trg_capa_items_updated_at ON capa_items;
CREATE TRIGGER trg_capa_items_updated_at BEFORE UPDATE ON capa_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- five_whys is a plain array of up to 5 strings — the honest, simple
-- version of structured root-cause analysis. Fishbone/fault-tree
-- diagramming tools are a separate, bigger UI commitment, not built here.
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  csr_project_id UUID REFERENCES csr_projects(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (
    category IN ('safety', 'fraud', 'data_breach', 'beneficiary_complaint', 'reputational', 'regulatory', 'other')
  ),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved')),
  description TEXT NOT NULL,
  five_whys TEXT[],
  reported_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incidents_org ON incidents (organization_id);

DROP TRIGGER IF EXISTS trg_incidents_updated_at ON incidents;
CREATE TRIGGER trg_incidents_updated_at BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
