-- Governance OS foundation (ERT 1), scoped to what's real: an immutable
-- decision log over existing approval actions, time-bounded delegation of
-- an existing permission, and a versioned policy repository with
-- acknowledgement tracking. Deliberately NOT a Board/Committee/Meeting/
-- Voting domain or a generic workflow engine — see docs/ARCHITECTURE.md.

-- Append-only — no updated_at/deleted_at. A decision, once made, is never
-- edited or removed; corrections are new decisions, not mutations.
CREATE TABLE IF NOT EXISTS governance_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  decided_by UUID REFERENCES users(id),
  decision_type TEXT NOT NULL, -- e.g. 'csr_project.approved', 'verification.approved'
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  rationale TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_governance_decisions_org ON governance_decisions (organization_id);
CREATE INDEX IF NOT EXISTS idx_governance_decisions_entity ON governance_decisions (entity_type, entity_id);

CREATE TABLE IF NOT EXISTS delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  delegator_user_id UUID NOT NULL REFERENCES users(id),
  delegate_user_id UUID NOT NULL REFERENCES users(id),
  permission_key TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_delegations_delegate ON delegations (delegate_user_id, organization_id, permission_key);

CREATE TABLE IF NOT EXISTS governance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  version INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'superseded', 'retired')),
  effective_date DATE,
  review_date DATE,
  superseded_by UUID REFERENCES governance_policies(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_governance_policies_org_status ON governance_policies (organization_id, status);

CREATE TABLE IF NOT EXISTS policy_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES governance_policies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (policy_id, user_id)
);

DROP TRIGGER IF EXISTS trg_governance_policies_updated_at ON governance_policies;
CREATE TRIGGER trg_governance_policies_updated_at BEFORE UPDATE ON governance_policies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- New governance permissions.
INSERT INTO permissions (key, description) VALUES
  ('Governance.Policy.Read', 'View governance policies'),
  ('Governance.Policy.Write', 'Create, edit, and publish governance policies'),
  ('Governance.Decision.Read', 'View the governance decision log'),
  ('Governance.Delegation.Manage', 'Delegate own approval permissions to another member')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.key IN (
  'Governance.Policy.Read', 'Governance.Policy.Write', 'Governance.Decision.Read', 'Governance.Delegation.Manage'
) WHERE r.key = 'corporate_admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.key IN (
  'Governance.Policy.Read', 'Governance.Decision.Read'
) WHERE r.key IN ('csr_manager', 'ngo_admin', 'auditor', 'support')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.key = 'platform_admin' AND p.key LIKE 'Governance.%'
ON CONFLICT DO NOTHING;
