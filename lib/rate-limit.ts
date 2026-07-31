/**
 * In-memory fixed-window rate limiter. Sufficient for a single Render web
 * service instance; if this app ever scales to multiple instances, this
 * needs to move to a shared store (Redis) since each instance would
 * otherwise track its own counts — see docs/ARCHITECTURE.md roadmap.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count++;
  return { allowed: true, remaining: limit - bucket.count };
}

export function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}
