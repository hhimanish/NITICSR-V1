CREATE TABLE IF NOT EXISTS csr_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_org_id UUID NOT NULL REFERENCES organizations(id),
  ngo_profile_id UUID REFERENCES ngo_profiles(id),
  csr_category_id UUID NOT NULL REFERENCES csr_categories(id),
  title TEXT NOT NULL,
  description TEXT,
  budget_amount NUMERIC(14, 2),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'proposed', 'approved', 'active', 'completed', 'cancelled')
  ),
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS project_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  csr_project_id UUID NOT NULL REFERENCES csr_projects(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  district TEXT,
  -- Plain lat/lng for now; a PostGIS geometry column is a natural additive
  -- migration later (see docs/ARCHITECTURE.md roadmap) once geo queries are
  -- actually needed — adding it speculatively now would be unused schema.
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_sdgs (
  csr_project_id UUID NOT NULL REFERENCES csr_projects(id) ON DELETE CASCADE,
  sdg_id SMALLINT NOT NULL REFERENCES sdgs(id),
  PRIMARY KEY (csr_project_id, sdg_id)
);

CREATE TABLE IF NOT EXISTS beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  csr_project_id UUID NOT NULL REFERENCES csr_projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  count_estimate INTEGER CHECK (count_estimate >= 0),
  demographic_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  csr_project_id UUID NOT NULL REFERENCES csr_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'in_progress', 'completed', 'delayed')
  ),
  completed_at TIMESTAMPTZ,
  evidence_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_csr_projects_corporate ON csr_projects (corporate_org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_csr_projects_ngo ON csr_projects (ngo_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_csr_projects_status ON csr_projects (status);
CREATE INDEX IF NOT EXISTS idx_project_locations_project ON project_locations (csr_project_id);
CREATE INDEX IF NOT EXISTS idx_project_locations_state ON project_locations (state);
CREATE INDEX IF NOT EXISTS idx_milestones_project_status ON milestones (csr_project_id, status);

DROP TRIGGER IF EXISTS trg_csr_projects_updated_at ON csr_projects;
CREATE TRIGGER trg_csr_projects_updated_at BEFORE UPDATE ON csr_projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_milestones_updated_at ON milestones;
CREATE TRIGGER trg_milestones_updated_at BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
