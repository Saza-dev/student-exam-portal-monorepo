import { z } from "zod";

/**
 * Papers list filtering validation schema
 * Used by: papers-svc, frontend
 */
export const papersFilterSchema = z.object({
  subject: z.string().optional(),
  exam_board: z.string().optional(),
  year: z.coerce.number().min(1900).max(new Date().getFullYear()).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  page: z.coerce.number().min(1).default(1),
});

export type PapersFilterInput = z.infer<typeof papersFilterSchema>;

/**
 * Get paper by ID validation schema
 */
export const getPaperSchema = z.object({
  paperId: z.string().uuid("Invalid paper ID"),
});

export type GetPaperInput = z.infer<typeof getPaperSchema>;

/**
 * Create paper validation schema (admin only)
 */
export const createPaperSchema = z.object({
  title: z.string().min(1).max(255),
  subject: z.string().min(1).max(100),
  exam_board: z.string().min(1).max(100),
  type: z.enum(["past_paper", "model_paper"]),
  year: z.number(),
  pdf_url: z.string().url(),
});

export type CreatePaperInput = z.infer<typeof createPaperSchema>;
