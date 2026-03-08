import { Context, Next } from "hono";
import { verify } from "hono/jwt";

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface HonoEnvWithJWT {
  Bindings: {
    JWT_SECRET: string;
    KV: KVNamespace;
    DATABASE_URL: string;
  };
  Variables: {
    user: {
      user_id: string;
      email: string;
      role: string;
    };
  };
}

/**
 * Extract user from request headers (set by API Gateway)
 * Returns null if headers don't exist
 */
export function extractUserFromHeaders(c: Context): {
  user_id: string;
  email: string;
  role: string;
} | null {
  const userId = c.req.header("X-User-Id");
  const email = c.req.header("X-User-Email");
  const role = c.req.header("X-User-Role");

  if (!userId) return null;

  return {
    user_id: userId,
    email: email || "",
    role: role || "student",
  };
}

/**
 * JWT Authentication Middleware - with Header Fallback
 * 1. First checks for X-User-* headers (from API Gateway)
 * 2. Falls back to JWT verification if headers not present
 * 3. Sets user context with decoded payload
 *
 * This allows services to work both:
 * - When called through API Gateway (uses headers)
 * - When called directly (validates JWT)
 */
export const jwtAuth = async (c: Context<HonoEnvWithJWT>, next: Next) => {
  // First, try to extract user from headers (API Gateway already validated)
  let user = extractUserFromHeaders(c);

  if (user) {
    c.set("user", user);
    return next();
  }

  // Fallback: Validate JWT directly (for direct service calls)
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: { code: 401, message: "Unauthorized" } }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = (await verify(
      token,
      c.env.JWT_SECRET,
      "HS256",
    )) as JWTPayload;

    c.set("user", {
      user_id: String(payload.sub),
      email: String(payload.email),
      role: String(payload.role),
    });

    await next();
  } catch (error) {
    return c.json(
      { error: { code: 401, message: "Invalid or expired token" } },
      401,
    );
  }
};

/**
 * Optional JWT Middleware - with Header Fallback
 * Attempts to extract user from headers or verify JWT
 * Allows request to continue if authentication not present
 */
export const jwtAuthOptional = async (
  c: Context<HonoEnvWithJWT>,
  next: Next,
) => {
  // First, try to extract user from headers (API Gateway already validated)
  let user = extractUserFromHeaders(c);

  if (user) {
    c.set("user", user);
    return next();
  }

  // Fallback: Try JWT validation
  const authHeader = c.req.header("Authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    try {
      const payload = (await verify(
        token,
        c.env.JWT_SECRET,
        "HS256",
      )) as JWTPayload;

      c.set("user", {
        user_id: String(payload.sub),
        email: String(payload.email),
        role: String(payload.role),
      });
    } catch (error) {
      console.error("JWT verification error:", error);
    }
  }

  await next();
};
