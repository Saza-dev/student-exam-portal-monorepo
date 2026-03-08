import { Context, Next } from "hono";
import { HonoConfig } from "../types/env";

export const slidingRateLimiter = async (
  c: Context<HonoConfig>, // Update this to use the full HonoConfig
  next: Next,
) => {
  const ip = c.req.header("CF-Connecting-IP") || "anonymous";
  const authHeader = c.req.header("Authorization");

  // Requirement 3: Tiered limits (120 for auth, 60 for public)
  const limit = authHeader ? 120 : 60;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const key = `rate_limit:${ip}`;

  // 1. Retrieve the list of timestamps from KV
  const record = ((await c.env.KV.get(key, "json")) as number[]) || [];

  // 2. Filter out timestamps older than 60 seconds (The "Sliding" logic)
  const recentRequests = record.filter(
    (timestamp) => now - timestamp < windowMs,
  );

  // 3. Requirement 3: Check if limit is breached and return 429
  if (recentRequests.length >= limit) {
    return c.json(
      { error: "Too Many Requests", message: "Rate limit exceeded." },
      429,
      { "Retry-After": "60" }, // Requirement 3: Mandatory Retry-After header
    );
  }

  // 4. Update the record and save back to KV
  recentRequests.push(now);
  await c.env.KV.put(key, JSON.stringify(recentRequests), {
    expirationTtl: 60,
  });

  await next();
};
