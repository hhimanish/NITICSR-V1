-- Knowledge & Ecosystem Platform (ERT 12): finishing the two dormant
-- developer-platform tables from Phase 2 (api_keys, webhooks — see
-- 007_platform.sql) rather than adding new schema, plus one feature flag
-- gating the only genuinely public-facing, identity-revealing surface this
-- ERT ships (the opt-in NGO directory). Aggregate Open Data has no opt-in
-- gate since it reveals no single organization's identity.

INSERT INTO feature_flags (key, description, is_enabled, organization_id)
SELECT 'public_directory_opt_in',
       'Lists this NGO''s verified profile on the public /directory page',
       false, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM feature_flags WHERE key = 'public_directory_opt_in' AND organization_id IS NULL
);

-- webhooks.secret_hash (007_platform.sql) only supports verifying a
-- caller-supplied value against a stored hash — fine for API keys, but
-- outbound webhook delivery needs NITICSR to compute an HMAC signature on
-- every request it sends, which requires the actual secret, not a one-way
-- hash of it. secret_hash stays in place (unused) rather than being
-- dropped, since dropping a column is the one kind of migration change
-- this project treats as non-additive.
ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS secret TEXT;
