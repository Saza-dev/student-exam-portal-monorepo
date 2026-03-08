import { z } from "zod";

export const startSessionSchema = z.object({
  paperId: z.string().uuid(),
});

export const submitAnswerSchema = z.object({
  questionId: z.string().uuid(),
  selectedOptionId: z.string().nullable(),
});
