import { Hono } from "hono";
import { cors } from "hono/cors";
import { verify } from "hono/jwt";
import {
  slidingRateLimiter,
  createErrorResponse,
} from "@assessment/middleware";
import { generateRequestId } from "@assessment/utils";
import { HonoConfig } from "./types/env";

const app = new Hono<HonoConfig>();

// 1. Global Sliding Window Rate Limiting (first layer)
app.use("*", slidingRateLimiter);

// 2. Request ID & Error Handler Middleware
app.use("*", async (c, next) => {
  const requestId = generateRequestId();
  c.set("requestId", requestId);
  c.header("X-Request-Id", requestId);

  try {
    await next();
  } catch (err: any) {
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";

    return c.json(createErrorResponse(status, message, requestId), status);
  }
});

// 3. Environment-aware CORS
app.use("*", async (c, next) => {
  const corsMiddleware = cors({
    origin:
      c.env.ENVIRONMENT === "production"
        ? "https://app.examapp.com"
        : "http://localhost:3000",
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// 4. JWT Validation & Header Injection Middleware
// Only validates JWT, does NOT check authorization - services handle that
app.use("*", async (c, next) => {
  const requestId = c.get("requestId");

  // Public routes that don't require JWT
  const publicRoutes = [
    { path: "/auth/register", method: "POST" },
    { path: "/auth/login", method: "POST" },
    { path: "/auth/refresh", method: "POST" },
    { path: "/papers", method: "GET" },
    { path: "/papers/search", method: "GET" },
  ];

  const isPublic =
    publicRoutes.some(
      (r) => c.req.path === r.path && c.req.method === r.method,
    ) ||
    (c.req.path.startsWith("/papers/") && c.req.method === "GET");

  // Allow public routes to bypass JWT validation
  if (isPublic) return next();

  // For protected routes, validate JWT
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      createErrorResponse(
        401,
        "Missing or invalid authorization header",
        requestId,
      ),
      401,
    );
  }

  try {
    const token = authHeader.split(" ")[1];
    const payload = (await verify(token, c.env.JWT_SECRET, "HS256")) as any;

    // Inject user context into request headers for downstream services
    // Services will extract from headers instead of validating JWT again
    const newRequest = new Request(c.req.raw);
    newRequest.headers.set("X-User-Id", String(payload.sub || payload.user_id));
    newRequest.headers.set("X-User-Email", String(payload.email || ""));
    newRequest.headers.set("X-User-Role", String(payload.role || "student"));
    newRequest.headers.set("X-Request-ID", requestId);

    // Replace the raw request with the one containing user headers
    c.req.raw = newRequest;
    return next();
  } catch (error: any) {
    const message =
      error.message === "invalid jwt"
        ? "Invalid or expired token"
        : "Token verification failed";

    return c.json(createErrorResponse(401, message, requestId), 401);
  }
});

// 5. Service Routing via Bindings
// Pass all requests to appropriate services (they extract user from headers)
app.all("/auth/*", (c) => c.env.AUTH_SVC.fetch(c.req.raw as any) as any);
app.all("/papers/*", (c) => c.env.PAPERS_SVC.fetch(c.req.raw as any) as any);
app.all("/exam/*", (c) => c.env.EXAM_SVC.fetch(c.req.raw as any) as any);

// 6. Health check endpoint
app.get("/health", (c) =>
  c.json(
    {
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
      },
    },
    200,
  ),
);

export default app;
