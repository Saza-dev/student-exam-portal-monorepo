import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { startSessionSchema, submitAnswerSchema } from "@assessment/schemas";
import {
  jwtAuth,
  slidingRateLimiter,
  createErrorResponse,
} from "@assessment/middleware";
import {
  startSession,
  submitAnswer,
  submitExam,
  getReview,
  getSession,
  getTimer,
} from "../controllers/exam.controller";
import type { Env } from "../types/env";

const exam = new Hono<{ Bindings: Env }>();

// Apply middleware
exam.use("/*", slidingRateLimiter);
exam.use("/*", jwtAuth);

exam.post(
  "/sessions",
  zValidator("json", startSessionSchema, (result, c) => {
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
  startSession,
);

exam.post(
  "/sessions/:id/answer",
  zValidator("json", submitAnswerSchema, (result, c) => {
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
  submitAnswer,
);

exam.post("/sessions/:id/submit", submitExam);
exam.get("/sessions/:id/review", getReview);

exam.get("/sessions/:id", getSession);
exam.get("/sessions/:id/timer", getTimer);

export default exam;
