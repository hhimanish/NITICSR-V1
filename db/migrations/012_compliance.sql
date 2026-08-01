-- Compliance & Regulatory Operations (ERT 2), scoped to what's real: an
-- obligation register grounded in Schedule VII (csr_categories already
-- carries schedule_vii_clause), deterministic gap checks over data the
-- platform already collects, and a per-entity compliance status rather than
-- a parallel "compliance module". See docs/ARCHITECTURE.md. Deliberately NOT
-- a regulatory knowledge graph, configurable rules/workflow engine, or
-- evidence vault — those need a real regulatory corpus / concrete rule
-- backlog / file upload pipeline that don't exist yet.

CREATE TABLE IF NOT EXISTS compliance_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  csr_project_id UUID NOT NULL REFERENCES csr_projects(id) ON DELETE CASCADE,
  obligation_type TEXT NOT NULL CHECK (obligation_type IN (
    'schedule_vii_classification', 'utilization_reporting', 'csr2_filing', 'impact_documentation'
  )),
  description TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'satisfied', 'waived')),
  satisfied_at TIMESTAMPTZ,
  satisfied_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (csr_project_id, obligation_type)
);

CREATE INDEX IF NOT EXISTS idx_compliance_obligations_org ON compliance_obligations (organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_obligations_project ON compliance_obligations (csr_project_id);
CREATE INDEX IF NOT EXISTS idx_compliance_obligations_due ON compliance_obligations (due_date) WHERE status = 'pending';

INSERT INTO permissions (key, description) VALUES
  ('Compliance.Obligation.Read', 'View compliance obligations and status'),
  ('Compliance.Obligation.Write', 'Mark compliance obligations satisfied or waived')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.key IN (
  'Compliance.Obligation.Read', 'Compliance.Obligation.Write'
) WHERE r.key IN ('corporate_admin', 'csr_manager')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.key = 'Compliance.Obligation.Read'
WHERE r.key IN ('ngo_admin', 'auditor', 'support')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.key = 'platform_admin' AND p.key LIKE 'Compliance.%'
ON CONFLICT DO NOTHING;
