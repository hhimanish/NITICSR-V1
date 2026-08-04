-- Platform Services (ERT 11): the only new permission this ERT needs. Global
-- (organization_id IS NULL) feature flag writes are gated separately from the
-- existing Organization.Write permission (which already covers org-scoped
-- overrides) because changing a platform-wide default affects every tenant,
-- not just the caller's own organization.

INSERT INTO permissions (key, description) VALUES
  ('Platform.FeatureFlag.Manage', 'Create/update global (platform-wide) feature flag defaults')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.key = 'Platform.FeatureFlag.Manage'
WHERE r.key = 'platform_admin'
ON CONFLICT DO NOTHING;
