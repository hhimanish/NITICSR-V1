import { z } from "zod";

import { logger } from "@/lib/logger";

/**
 * Boot-time environment validation. Split into two tiers rather than one
 * all-or-nothing schema: REQUIRED vars are the ones every request path
 * depends on (DB, auth) and are worth failing fast on — a misconfigured
 * deploy should refuse to serve traffic rather than 500 on the first real
 * request. RECOMMENDED vars gate a single feature each (AI Copilot, email,
 * background jobs) that already degrades gracefully on its own (see
 * docs/RUNBOOK.md) — missing one of those is worth a loud warning, not
 * taking the whole app down.
 */

const RequiredEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
});

const RECOMMENDED_KEYS = [
  "CEREBRAS_API_KEY",
  "CLERK_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "INTERNAL_JOB_SECRET",
] as const;

/** Throws on missing required vars **in production only** — refusing to
 * serve traffic on a misconfigured deploy is the point, but a contributor
 * running `next dev` with an incomplete `.env` (e.g. testing only the
 * marketing site, no Clerk/DB set up yet) is normal and shouldn't be
 * blocked from starting the app at all. Development just logs the same
 * warning every missing var gets. Call once at process boot (see
 * instrumentation.ts) — not on every request. */
export function validateEnv() {
  const result = RequiredEnvSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    const message = `Missing required environment variables: ${missing}`;
    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    }
    logger.warn(message);
  }

  for (const key of RECOMMENDED_KEYS) {
    if (!process.env[key]) {
      logger.warn(`Recommended environment variable not set: ${key}`, {
        feature: key,
      });
    }
  }

  logger.info("Environment validated at boot");
}
