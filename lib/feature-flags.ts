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
