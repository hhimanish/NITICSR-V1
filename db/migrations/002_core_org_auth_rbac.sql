-- Core multi-tenant + permission-based RBAC schema.
-- Identity itself is owned by Clerk; these tables model *our* domain concepts
-- (organizations, membership, roles/permissions) and are kept in sync via the
-- Clerk webhook (see app/api/webhooks/clerk/route.ts).

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('corporate', 'ngo', 'auditor', 'government', 'admin')),
  clerk_org_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE, -- e.g. "CSR.Project.Read"
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members (user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members (organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations (type) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON organizations;
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_roles_updated_at ON roles;
CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_org_members_updated_at ON organization_members;
CREATE TRIGGER trg_org_members_updated_at BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed permission catalogue (resource.entity.action style, per spec).
INSERT INTO permissions (key, description) VALUES
  ('Organization.Read', 'View organization profile and membership'),
  ('Organization.Write', 'Edit organization profile'),
  ('Organization.ManageMembers', 'Invite, remove, or re-role members'),
  ('NGO.Profile.Read', 'View NGO profiles'),
  ('NGO.Profile.Write', 'Edit an NGO profile'),
  ('NGO.Verify', 'Review and approve NGO verification requests'),
  ('CSR.Project.Read', 'View CSR projects'),
  ('CSR.Project.Write', 'Create or edit CSR projects'),
  ('CSR.Project.Approve', 'Approve a CSR project for funding'),
  ('Verification.Submit', 'Submit a verification request'),
  ('Verification.Review', 'Review a verification request'),
  ('Verification.Approve', 'Approve/reject a verification request'),
  ('Audit.Submit', 'Submit an audit record'),
  ('Audit.Approve', 'Approve an audit record'),
  ('Corporate.Approve', 'Approve corporate-side CSR spend decisions')
ON CONFLICT (key) DO NOTHING;

-- Seed default roles.
INSERT INTO roles (key, name, description) VALUES
  ('platform_admin', 'Platform Admin', 'Full access across the platform'),
  ('corporate_admin', 'Corporate Admin', 'Manages a corporate organization and its CSR program'),
  ('csr_manager', 'CSR Manager', 'Manages CSR projects and partner discovery day-to-day'),
  ('ngo_admin', 'NGO Admin', 'Manages an NGO''s profile, documents, and projects'),
  ('auditor', 'Auditor', 'Independent reviewer of audits and verification'),
  ('support', 'Support', 'Read-only cross-platform support access')
ON CONFLICT (key) DO NOTHING;

-- platform_admin: everything.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.key = 'platform_admin'
ON CONFLICT DO NOTHING;

-- corporate_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.key IN (
  'Organization.Read', 'Organization.Write', 'Organization.ManageMembers',
  'NGO.Profile.Read', 'CSR.Project.Read', 'CSR.Project.Write', 'CSR.Project.Approve',
  'Verification.Submit', 'Corporate.Approve'
) WHERE r.key = 'corporate_admin'
ON CONFLICT DO NOTHING;

-- csr_manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.key IN (
  'Organization.Read', 'NGO.Profile.Read', 'CSR.Project.Read', 'CSR.Project.Write',
  'Verification.Submit'
) WHERE r.key = 'csr_manager'
ON CONFLICT DO NOTHING;

-- ngo_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.key IN (
  'Organization.Read', 'Organization.Write', 'NGO.Profile.Read', 'NGO.Profile.Write',
  'CSR.Project.Read', 'Verification.Submit'
) WHERE r.key = 'ngo_admin'
ON CONFLICT DO NOTHING;

-- auditor
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.key IN (
  'Organization.Read', 'NGO.Profile.Read', 'CSR.Project.Read',
  'Verification.Review', 'Verification.Approve', 'Audit.Submit', 'Audit.Approve', 'NGO.Verify'
) WHERE r.key = 'auditor'
ON CONFLICT DO NOTHING;

-- support
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.key IN (
  'Organization.Read', 'NGO.Profile.Read', 'CSR.Project.Read', 'Verification.Review'
) WHERE r.key = 'support'
ON CONFLICT DO NOTHING;
