-- Project Execution (ERT 6), anchored on finishing real dormant schema
-- first: `milestones` has existed since Phase 2 (005_csr_projects.sql)
-- with zero CRUD API — this migration's companion API routes finally
-- give it one, before adding anything new around it. Everything else
-- here extends csr_projects/milestones rather than a parallel PMO
-- domain. Deliberately NOT resource/staffing planning (no HR data model
-- exists) and NOT a drag-and-drop rescheduling engine — see
-- docs/ARCHITECTURE.md's ERT 6 section.

CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_programs_updated_at ON programs;
CREATE TRIGGER trg_programs_updated_at BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE csr_projects
  ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_csr_projects_program ON csr_projects (program_id);

-- Sub-checklist items under an existing milestone — finer-grained than
-- the milestone itself, no new project-level concept.
CREATE TABLE IF NOT EXISTS milestone_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
  done_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_milestone_tasks_milestone ON milestone_tasks (milestone_id);

-- A simple "blocks/blocked by" link — not a scheduling engine, just a
-- real relationship a PM would otherwise track in a spreadsheet.
CREATE TABLE IF NOT EXISTS milestone_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  depends_on_milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (milestone_id != depends_on_milestone_id),
  UNIQUE (milestone_id, depends_on_milestone_id)
);

-- Project-scoped risk/issue log. The enterprise-wide Risk & Audit
-- platform (heat maps, CAPA, root-cause) is a separate, later capability
-- (ERT 8 in the roadmap this was scoped from) — this is deliberately
-- just a real per-project register, not that.
CREATE TABLE IF NOT EXISTS project_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  csr_project_id UUID NOT NULL REFERENCES csr_projects(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('risk', 'issue')),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'mitigated', 'closed')),
  owner_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_risks_project ON project_risks (csr_project_id);

DROP TRIGGER IF EXISTS trg_project_risks_updated_at ON project_risks;
CREATE TRIGGER trg_project_risks_updated_at BEFORE UPDATE ON project_risks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- A change to budget/timeline on an already-approved project requires
-- the same approval authority as the original approval — reuses
-- CSR.Project.Approve rather than inventing a parallel workflow engine.
CREATE TABLE IF NOT EXISTS change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  csr_project_id UUID NOT NULL REFERENCES csr_projects(id) ON DELETE CASCADE,
  field TEXT NOT NULL CHECK (field IN ('budget_amount', 'end_date')),
  current_value TEXT NOT NULL,
  requested_value TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by UUID REFERENCES users(id),
  decided_by UUID REFERENCES users(id),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_change_requests_project ON change_requests (csr_project_id);
