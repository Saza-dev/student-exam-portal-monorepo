import { Context, Next } from "hono";

export interface RateLimitConfig {
  /** Request limit per window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Optional message for rate limit exceeded */
  message?: string;
}

export interface RateLimitEnv {
  Bindings: {
    KV: KVNamespace;
  };
}

/**
 * Sliding Window Rate Limiter Middleware
 * Uses Cloudflare KV to track requests per IP address
 * Default: 120 for authenticated users, 60 for anonymous
 */
export const slidingRateLimiter = async (
  c: Context<RateLimitEnv>,
  next: Next,
  config?: RateLimitConfig,
) => {
  const ip = c.req.header("CF-Connecting-IP") || "anonymous";
  const authHeader = c.req.header("Authorization");

  // Default tiered limits
  const limit = config?.limit ?? (authHeader ? 120 : 60);
  const windowMs = config?.windowMs ?? 60 * 1000;
  const message = config?.message ?? "Rate limit exceeded";

  const now = Date.now();
  const key = `rate_limit:${ip}`;

  // 1. Retrieve the list of timestamps from KV
  const record = ((await c.env.KV.get(key, "json")) as number[]) || [];

  // 2. Filter out timestamps older than the window (sliding window logic)
  const recentRequests = record.filter(
    (timestamp) => now - timestamp < windowMs,
  );

  // 3. Check if limit is breached
  if (recentRequests.length >= limit) {
    return c.json(
      {
        error: {
          code: 429,
          message,
          request_id: c.req.header("X-Request-ID"),
        },
      },
      429,
      { "Retry-After": String(Math.ceil(windowMs / 1000)) },
    );
  }

  // 4. Update the record and save back to KV
  recentRequests.push(now);
  await c.env.KV.put(key, JSON.stringify(recentRequests), {
    expirationTtl: Math.ceil(windowMs / 1000),
  });

  await next();
};
