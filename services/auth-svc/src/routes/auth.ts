import { Hono } from "hono";
import { HonoEnv } from "../types/hono";
import { zValidator } from "@hono/zod-validator";
import { registerSchema, loginSchema } from "@assessment/schemas";
import {
  slidingRateLimiter,
  createErrorResponse,
  jwtAuth,
} from "@assessment/middleware";
import {
  registerUser,
  loginUser,
  refreshTokens,
  logoutUser,
} from "../controllers/auth.controller";

const auth = new Hono<HonoEnv>();

// Apply rate limiter to all auth routes
auth.use("*", slidingRateLimiter);

// register
auth.post(
  "/register",
  zValidator("json", registerSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        createErrorResponse(
          422,
          "Validation error",
          c.req.header("X-Request-ID"),
          {
            errors: result.error.issues.map((issue) => ({
              field: issue.path[0],
              message: issue.message,
            })),
          },
        ),
        422,
      );
    }
  }),
  registerUser,
);

// login
auth.post(
  "/login",
  zValidator("json", loginSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        createErrorResponse(
          422,
          "Validation error",
          c.req.header("X-Request-ID"),
          {
            errors: result.error.issues.map((issue) => ({
              field: issue.path[0],
              message: issue.message,
            })),
          },
        ),
        422,
      );
    }
  }),
  loginUser,
);

// refresh tokens
auth.post("/refresh", refreshTokens);

// Logout
auth.post("/logout", logoutUser);

// Get current user
auth.get("/me", jwtAuth, (c) => {
  const user = c.get("user");
  return c.json(
    {
      data: {
        user,
      },
    },
    200,
  );
});

export default auth;
