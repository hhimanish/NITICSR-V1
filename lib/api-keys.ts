import { randomBytes, createHash } from "node:crypto";

import { getPool } from "@/lib/db";

/**
 * Self-service API keys (ERT 12) — finishing `api_keys`, dormant since
 * Phase 2 (`db/migrations/007_platform.sql`). The raw key is only ever
 * returned once, at creation; everything after that compares a SHA-256
 * hash, the same pattern `webhooks.secret_hash` was designed around.
 */

export function hashApiKey(rawKey: string) {
  return createHash("sha256").update(rawKey).digest("hex");
}

function generateRawKey() {
  return `nk_live_${randomBytes(24).toString("hex")}`;
}

export async function createApiKey(organizationId: string, name: string, createdByUserId: string) {
  const rawKey = generateRawKey();
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.slice(0, 12);

  const { rows } = await getPool().query(
    `INSERT INTO api_keys (organization_id, name, key_hash, key_prefix, created_by)
     VALUES ($1, $2, $3, $4, (SELECT id FROM users WHERE clerk_user_id = $5))
     RETURNING id, name, key_prefix, created_at`,
    [organizationId, name, keyHash, keyPrefix, createdByUserId]
  );

  return { ...rows[0], rawKey };
}

export async function listApiKeys(organizationId: string) {
  const { rows } = await getPool().query(
    `SELECT id, name, key_prefix, last_used_at, revoked_at, created_at
       FROM api_keys
      WHERE organization_id = $1
      ORDER BY created_at DESC`,
    [organizationId]
  );
  return rows;
}

export async function revokeApiKey(id: string, organizationId: string) {
  const { rows } = await getPool().query(
    `UPDATE api_keys SET revoked_at = now()
      WHERE id = $1 AND organization_id = $2 AND revoked_at IS NULL
      RETURNING id`,
    [id, organizationId]
  );
  return rows.length > 0;
}
