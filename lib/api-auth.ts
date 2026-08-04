import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

import { hashApiKey } from "@/lib/api-keys";
import { getPool } from "@/lib/db";

export type CallerContext =
  | { type: "session"; clerkUserId: string }
  | { type: "apiKey"; organizationId: string; keyId: string };

/**
 * Resolves the caller from either a Clerk session cookie or a `Bearer`
 * API key (ERT 12) — the two authentication modes this platform supports
 * for server-to-server access, exactly the gap `docs/openapi.yaml` has
 * flagged as a "future API-key scheme" since Phase 2. An API-key caller's
 * organizationId comes from the key row itself, never from a client-
 * supplied param, so a key can't be used to reach beyond the single
 * organization it was issued to — the same IDOR-avoiding pattern ERT 11's
 * tenant-isolation audit found everywhere else in the codebase.
 */
export async function resolveCaller(req: NextRequest): Promise<CallerContext | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const rawKey = authHeader.slice("Bearer ".length).trim();
    if (!rawKey) return null;

    const { rows } = await getPool().query(
      `UPDATE api_keys SET last_used_at = now()
        WHERE key_hash = $1 AND revoked_at IS NULL
        RETURNING id, organization_id`,
      [hashApiKey(rawKey)]
    );
    if (rows.length === 0) return null;
    return { type: "apiKey", organizationId: rows[0].organization_id, keyId: rows[0].id };
  }

  const { userId } = await auth();
  if (!userId) return null;
  return { type: "session", clerkUserId: userId };
}
