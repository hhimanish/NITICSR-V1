/**
 * Runs once when a new server instance starts (Next.js instrumentation
 * hook) — not during `next build`, so CI builds without a live DATABASE_URL
 * are unaffected. Only the nodejs runtime touches env/DB config; the edge
 * runtime (middleware) never needs this.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/lib/config");
    validateEnv();
  }
}
