import { z } from "zod";

/**
 * Start exam session validation schema
 * Used by: exam-svc, frontend
 */
export const startSessionSchema = z.object({
  paperId: z.string().uuid("Invalid paper ID"),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;

/**
 * Submit answer validation schema
 * Used by: exam-svc
 */
export const submitAnswerSchema = z.object({
  questionId: z.string().uuid("Invalid question ID"),
  selectedOptionId: z.string().nullable(),
});

export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;

/**
 * End session validation schema
 */
export const endSessionSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
});

export type EndSessionInput = z.infer<typeof endSessionSchema>;

/**
 * Session status validation schema
 */
export const getSessionSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
});

export type GetSessionInput = z.infer<typeof getSessionSchema>;
