import { clerkClient } from "@clerk/nextjs/server";

import { getPool } from "@/lib/db";

export type ClerkUserSync = {
  clerkUserId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export async function upsertUserFromClerk(input: ClerkUserSync) {
  await getPool().query(
    `INSERT INTO users (clerk_user_id, email, full_name, avatar_url)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (clerk_user_id) DO UPDATE SET
       email = EXCLUDED.email,
       full_name = EXCLUDED.full_name,
       avatar_url = EXCLUDED.avatar_url,
       deleted_at = NULL`,
    [input.clerkUserId, input.email, input.fullName, input.avatarUrl]
  );
}

export async function softDeleteUserByClerkId(clerkUserId: string) {
  await getPool().query(`UPDATE users SET deleted_at = now() WHERE clerk_user_id = $1`, [
    clerkUserId,
  ]);
}

export async function findUserByClerkId(clerkUserId: string) {
  const { rows } = await getPool().query(
    `SELECT id, clerk_user_id, email, full_name, avatar_url FROM users WHERE clerk_user_id = $1 AND deleted_at IS NULL`,
    [clerkUserId]
  );
  return rows[0] ?? null;
}

// Self-heals the case where user.created hasn't landed yet (webhook lag, or
// signup racing straight into org creation) by pulling the user directly
// from Clerk instead of failing the request. The webhook stays the primary
// sync path; this is the fallback for the request that gets there first.
export async function getOrCreateUserFromClerk(clerkUserId: string) {
  const existing = await findUserByClerkId(clerkUserId);
  if (existing) return existing;

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkUserId);

  const email =
    clerkUser.emailAddresses.find((a) => a.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    null;
  if (!email) return null;

  await upsertUserFromClerk({
    clerkUserId,
    email,
    fullName: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null,
    avatarUrl: clerkUser.imageUrl ?? null,
  });

  return findUserByClerkId(clerkUserId);
}
