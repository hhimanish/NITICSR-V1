CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID REFERENCES users(id),
  recipient_email TEXT,
  channel TEXT NOT NULL DEFAULT 'email' CHECK (
    channel IN ('email', 'sms', 'whatsapp', 'push', 'slack', 'teams', 'webhook')
  ),
  template_key TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Append-only "who did what" trail — distinct from the Zero-Trust field
-- audit concept (GPS/EXIF/device attestation) in the master roadmap, which
-- is deferred until there's a mobile app to capture that data.
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  action TEXT NOT NULL, -- e.g. "csr_project.created"
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL, -- SHA-256 of the raw key; the raw key is shown once and never stored
  key_prefix TEXT NOT NULL, -- first few chars, for identification in UI
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  event_types TEXT[] NOT NULL DEFAULT '{}',
  secret_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL = global default
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (key, organization_id)
);

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL = platform default
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, key)
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications (status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs (organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys (organization_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_webhooks_org ON webhooks (organization_id) WHERE is_active;

DROP TRIGGER IF EXISTS trg_webhooks_updated_at ON webhooks;
CREATE TRIGGER trg_webhooks_updated_at BEFORE UPDATE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_feature_flags_updated_at ON feature_flags;
CREATE TRIGGER trg_feature_flags_updated_at BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_settings_updated_at ON settings;
CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
