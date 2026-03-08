import { Context } from "hono";
import * as schema from "@assessment/db";
import { drizzle } from "drizzle-orm/neon-http";
import { and, eq, count } from "drizzle-orm";
import { HonoEnv } from "../types/hono";
import {
  examSessions,
  purchases,
  sessionAnswers,
  questions,
} from "@assessment/db";
import { Env } from "../types/env";
import { z } from "zod";
import { submitAnswerSchema } from "@assessment/schemas";
import { createErrorResponse } from "@assessment/middleware";
import {
  getTimeRemaining,
  isSessionExpired,
  computeScore,
} from "@assessment/utils";

export const startSession = async (c: Context<HonoEnv>) => {
  const { paperId } = await c.req.json();

  const user = c.get("user");

  const userId = user?.user_id || c.req.header("X-User-Id");

  if (!userId) {
    return c.json(
      createErrorResponse(401, "Unauthorized", c.req.header("X-Request-ID")),
      401,
    );
  }

  const db = drizzle(c.env.DATABASE_URL);

  // 1. Verify Purchase
  const [purchase] = await db
    .select()
    .from(purchases)
    .where(and(eq(purchases.paperId, paperId), eq(purchases.userId, userId)));

  if (!purchase) {
    return c.json(
      createErrorResponse(
        403,
        "Paper not purchased",
        c.req.header("X-Request-ID"),
      ),
      403,
    );
  }

  // 2. Check for active session
  const [activeSession] = await db
    .select()
    .from(examSessions)
    .where(
      and(
        eq(examSessions.userId, userId),
        eq(examSessions.paperId, paperId),
        eq(examSessions.status, "in_progress"),
      ),
    );

  if (activeSession) {
    return c.json(
      createErrorResponse(
        409,
        "Session already in progress",
        c.req.header("X-Request-ID"),
      ),
      409,
    );
  }

  // 3. Insert session with expiry (1 hour duration)
  const durationSeconds = 3600;
  const expiresAt = new Date(Date.now() + durationSeconds * 1000);

  const [session] = await db
    .insert(examSessions)
    .values({
      userId,
      paperId,
      expiresAt,
      status: "in_progress",
    })
    .returning();

  // 4. Store in KV
  await c.env.KV.put(`session:${session.id}`, expiresAt.toISOString(), {
    expirationTtl: durationSeconds,
  });

  return c.json(
    {
      data: {
        session_id: session.id,
        expires_at: expiresAt.toISOString(),
        expires_in: durationSeconds,
      },
    },
    201,
  );
};
export const submitAnswer = async (
  c: Context<
    {
      Bindings: Env;
    },
    "/sessions/:id/answer",
    { out: { json: z.infer<typeof submitAnswerSchema> } }
  >,
) => {
  const sessionId = c.req.param("id");

  const { questionId, selectedOptionId } = c.req.valid("json");

  if (!sessionId) {
    return c.json(
      createErrorResponse(
        400,
        "Missing session ID",
        c.req.header("X-Request-ID"),
      ),
      400,
    );
  }

  // 1. Check KV for expiry
  const expiry = await c.env.KV.get(`session:${sessionId}`);
  if (!expiry || new Date() > new Date(expiry)) {
    const db = drizzle(c.env.DATABASE_URL, { schema });
    await db
      .update(schema.examSessions)
      .set({ status: "expired" })
      .where(eq(schema.examSessions.id, sessionId));
    return c.json(
      createErrorResponse(410, "Session expired", c.req.header("X-Request-ID")),
      410,
    );
  }

  // 2. Upsert answer
  const db = drizzle(c.env.DATABASE_URL, { schema });
  await db
    .insert(schema.sessionAnswers)
    .values({
      sessionId: sessionId,
      questionId: questionId,
      selectedOptionId: selectedOptionId,
    })
    .onConflictDoUpdate({
      target: [
        schema.sessionAnswers.sessionId,
        schema.sessionAnswers.questionId,
      ],
      set: {
        selectedOptionId: selectedOptionId,
        answeredAt: new Date(),
      },
    });

  return c.json(
    {
      data: {
        success: true,
      },
    },
    200,
  );
};

export const submitExam = async (c: Context<HonoEnv>) => {
  const sessionId = c.req.param("id");

  const user = c.get("user");
  const userId = user?.user_id || c.req.header("X-User-Id");

  // 1. Validation: Ensure IDs are present and narrow types
  if (!sessionId || !userId) {
    return c.json(
      createErrorResponse(
        401,
        "Unauthorized or missing session ID",
        c.req.header("X-Request-ID"),
      ),
      401,
    );
  }

  const db = drizzle(c.env.DATABASE_URL);

  // 2. Fetch user answers and correct answers independently
  const userAnswers = await db
    .select({
      selected: sessionAnswers.selectedOptionId,
      correct: questions.correctOptionId,
    })
    .from(sessionAnswers)
    .innerJoin(questions, eq(sessionAnswers.questionId, questions.id))
    .where(eq(sessionAnswers.sessionId, sessionId));

  // 3. Fetch session and paper info
  const [sessionInfo] = await db
    .select({ paperId: examSessions.paperId })
    .from(examSessions)
    .where(eq(examSessions.id, sessionId));

  if (!sessionInfo) {
    return c.json(
      createErrorResponse(
        404,
        "Session not found",
        c.req.header("X-Request-ID"),
      ),
      404,
    );
  }

  // 4. Get total question count for percentage calculation
  const [totalQuestions] = await db
    .select({ count: count() })
    .from(questions)
    .where(eq(questions.paperId, sessionInfo.paperId));

  // 5. Independent Score Computation
  const correctCount = userAnswers.filter(
    (a) => a.selected === a.correct,
  ).length;

  const totalCount = totalQuestions?.count ?? 0;
  const scorePct = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

  // 6. Update session status and score
  await db
    .update(examSessions)
    .set({
      status: "submitted",
      scorePct: scorePct.toFixed(2),
      submittedAt: new Date(),
    })
    .where(
      and(eq(examSessions.id, sessionId), eq(examSessions.userId, userId)),
    );

  // 7. Cleanup: Delete the session key from KV
  await c.env.KV.delete(`session:${sessionId}`);

  return c.json(
    {
      data: {
        message: "Exam submitted successfully",
        score: parseFloat(scorePct.toFixed(2)),
      },
    },
    200,
  );
};

export const getReview = async (c: Context<HonoEnv>) => {
  const sessionId = c.req.param("id");

  const user = c.get("user");
  const userId = user?.user_id || c.req.header("X-User-Id");

  // 1. Explicit Validation & Type Narrowing
  if (!sessionId || !userId) {
    return c.json(
      createErrorResponse(
        401,
        "Unauthorized or missing session ID",
        c.req.header("X-Request-ID"),
      ),
      401,
    );
  }

  const db = drizzle(c.env.DATABASE_URL);

  // 2. Verify session status and ownership
  const [session] = await db
    .select()
    .from(examSessions)
    .where(
      and(eq(examSessions.id, sessionId), eq(examSessions.userId, userId)),
    );

  // Ensure only the session owner can view and only if submitted
  if (!session || session.status !== "submitted") {
    return c.json(
      createErrorResponse(
        403,
        "Review not available until submission",
        c.req.header("X-Request-ID"),
      ),
      403,
    );
  }

  // 3. Return full breakdown with joined question data
  const reviewData = await db
    .select({
      question: questions.questionText,
      options: questions.options,
      selected: sessionAnswers.selectedOptionId,
      correct: questions.correctOptionId,
      explanation: questions.explanation,
      isCorrect: sessionAnswers.isCorrect,
    })
    .from(sessionAnswers)
    .innerJoin(questions, eq(sessionAnswers.questionId, questions.id))
    .where(eq(sessionAnswers.sessionId, sessionId));

  return c.json(
    {
      data: reviewData,
    },
    200,
  );
};

export const getSession = async (c: Context<HonoEnv>) => {
  const sessionId = c.req.param("id");
  const user = c.get("user");
  const userId = user?.user_id;

  // Narrow types for safety
  if (!sessionId || !userId) {
    return c.json(
      createErrorResponse(
        401,
        "Unauthorized or missing session ID",
        c.req.header("X-Request-ID"),
      ),
      401,
    );
  }

  const db = drizzle(c.env.DATABASE_URL, { schema });

  // 1. Verify Session Ownership
  const [session] = await db
    .select()
    .from(schema.examSessions)
    .where(
      and(
        eq(schema.examSessions.id, sessionId),
        eq(schema.examSessions.userId, userId),
      ),
    );

  if (!session) {
    return c.json(
      createErrorResponse(
        404,
        "Session not found",
        c.req.header("X-Request-ID"),
      ),
      404,
    );
  }

  // 2. Fetch Paper and nested Questions
  const paperData = await db.query.papers.findFirst({
    where: eq(schema.papers.id, session.paperId),
    with: {
      questions: true,
    },
  });

  return c.json(
    {
      data: {
        session,
        paper: paperData,
      },
    },
    200,
  );
};

// Fetch Authoritative Server Timer
export const getTimer = async (c: Context<HonoEnv>) => {
  const sessionId = c.req.param("id");

  // Read the original expiry from KV
  const expiryStr = await c.env.KV.get(`session:${sessionId}`);
  if (!expiryStr) {
    return c.json(
      {
        data: {
          remaining_seconds: 0,
        },
      },
      200,
    );
  }

  const expiresAt = new Date(expiryStr);
  const remainingSeconds = getTimeRemaining(expiresAt);

  return c.json(
    {
      data: {
        remaining_seconds: remainingSeconds,
      },
    },
    200,
  );
};
