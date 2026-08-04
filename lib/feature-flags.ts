import { getPool } from "@/lib/db";

/**
 * Org-level override wins over the global default; a key with no row at
 * all defaults to disabled — flags must be explicitly seeded (see
 * db/migrations/010_feature_flags_seed.sql) rather than silently on.
 */
export async function isFeatureEnabled(key: string, organizationId?: string): Promise<boolean> {
  const pool = getPool();

  if (organizationId) {
    const { rows } = await pool.query(
      `SELECT is_enabled FROM feature_flags WHERE key = $1 AND organization_id = $2`,
      [key, organizationId]
    );
    if (rows.length > 0) return rows[0].is_enabled;
  }

  const { rows } = await pool.query(
    `SELECT is_enabled FROM feature_flags WHERE key = $1 AND organization_id IS NULL`,
    [key]
  );
  return rows[0]?.is_enabled ?? false;
}

export type FeatureFlagView = {
  key: string;
  description: string | null;
  globalDefault: boolean;
  organizationOverride: boolean | null;
  effective: boolean;
};

/** Every global default flag, with the caller's own organization's override
 * (if any) alongside it — the whole picture a settings page needs in one
 * call, rather than one round trip per flag. */
export async function listFeatureFlags(organizationId: string): Promise<FeatureFlagView[]> {
  const { rows } = await getPool().query(
    `SELECT g.key, g.description, g.is_enabled AS global_default, o.is_enabled AS org_override
       FROM feature_flags g
       LEFT JOIN feature_flags o ON o.key = g.key AND o.organization_id = $1
      WHERE g.organization_id IS NULL
      ORDER BY g.key`,
    [organizationId]
  );

  return rows.map((r) => ({
    key: r.key,
    description: r.description,
    globalDefault: r.global_default,
    organizationOverride: r.org_override,
    effective: r.org_override ?? r.global_default,
  }));
}

/** Sets (creating if needed) this organization's override for a flag that
 * already has a global default row — an org can't invent a brand-new flag
 * key the platform doesn't know about. */
export async function setOrganizationFlagOverride(key: string, organizationId: string, isEnabled: boolean) {
  const { rows: existing } = await getPool().query(
    `SELECT 1 FROM feature_flags WHERE key = $1 AND organization_id IS NULL`,
    [key]
  );
  if (existing.length === 0) {
    throw new Error(`Unknown feature flag key: ${key}`);
  }

  await getPool().query(
    `INSERT INTO feature_flags (key, is_enabled, organization_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (key, organization_id) DO UPDATE SET is_enabled = $2, updated_at = now()`,
    [key, isEnabled, organizationId]
  );
}

/** Platform-admin-only: changes the global default every organization
 * without its own override inherits. */
export async function setGlobalFlagDefault(key: string, isEnabled: boolean, description?: string) {
  // Matches db/migrations/010_feature_flags_seed.sql's partial unique index
  // on (key) WHERE organization_id IS NULL — the plain UNIQUE(key,
  // organization_id) constraint doesn't fire here since Postgres treats
  // NULLs as distinct for uniqueness purposes.
  await getPool().query(
    `INSERT INTO feature_flags (key, description, is_enabled, organization_id)
     VALUES ($1, $2, $3, NULL)
     ON CONFLICT (key) WHERE organization_id IS NULL DO UPDATE SET
       is_enabled = $3,
       description = COALESCE($2, feature_flags.description),
       updated_at = now()`,
    [key, description ?? null, isEnabled]
  );
}
