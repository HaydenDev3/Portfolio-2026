// Simple in-memory rate limiter for sensitive endpoints
// Resets on each server restart — acceptable for preventing abuse

const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60_000
): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: maxAttempts - 1 };
  }

  entry.count++;
  if (entry.count > maxAttempts) {
    return { ok: false, remaining: 0 };
  }

  return { ok: true, remaining: maxAttempts - entry.count };
}
