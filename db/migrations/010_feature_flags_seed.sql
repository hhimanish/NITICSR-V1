-- feature_flags already existed (007_platform.sql) but had no code reading
-- it. This adds a partial unique index for global (organization_id IS NULL)
-- flags — the table's existing UNIQUE(key, organization_id) treats NULLs as
-- distinct per standard SQL, which would let ON CONFLICT/re-seeding silently
-- create duplicate global rows for the same key.
CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_flags_global_key
  ON feature_flags (key) WHERE organization_id IS NULL;

INSERT INTO feature_flags (key, description, is_enabled, organization_id)
SELECT 'ai_copilot', 'Shows the AI Copilot panel in workspace shells', true, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM feature_flags WHERE key = 'ai_copilot' AND organization_id IS NULL
);
