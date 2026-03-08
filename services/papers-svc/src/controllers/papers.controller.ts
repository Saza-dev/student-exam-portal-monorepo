import { Context } from "hono";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, eq, count } from "drizzle-orm";
import { Env } from "../types/env";
import { questions, purchases, papers } from "@assessment/db";
import { sql as drizzleSql } from "drizzle-orm";
import { createErrorResponse, jwtAuthOptional } from "@assessment/middleware";
import { successResponse } from "@assessment/utils";

export const getPapers = async (c: Context<{ Bindings: Env }>) => {
  const {
    subject,
    exam_board,
    language,
    type,
    year,
    page = "1",
    limit = "20",
  } = c.req.query();

  const db = drizzle(c.env.DATABASE_URL);

  const offset = (Number(page) - 1) * Number(limit);

  // 1. Build Conditional WHERE clause
  const filters = [];
  if (subject) filters.push(eq(papers.subject, subject));
  if (exam_board) filters.push(eq(papers.examBoard, exam_board as any));
  if (language) filters.push(eq(papers.language, language));
  if (type) filters.push(eq(papers.type, type as any));
  if (year) filters.push(eq(papers.year, Number(year)));

  // 2. Execute Paginated Query
  const [data, [totalResult]] = await Promise.all([
    db
      .select()
      .from(papers)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .limit(Number(limit))
      .offset(offset),
    db
      .select({ value: count() })
      .from(papers)
      .where(filters.length > 0 ? and(...filters) : undefined),
  ]);

  return c.json(
    successResponse(data, {
      page: Number(page),
      limit: Number(limit),
      total: totalResult.value,
      hasMore: offset + data.length < totalResult.value,
    }),
    200,
  );
};

export const getPaperById = async (
  c: Context<{
    Bindings: Env;
    Variables: {
      userId?: string;
    };
  }>,
) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const userId = user?.user_id;

  // Fail early if no ID is provided
  if (!id) {
    return c.json(
      createErrorResponse(
        400,
        "Paper ID is required",
        c.req.header("X-Request-ID"),
      ),
      400,
    );
  }

  const db = drizzle(c.env.DATABASE_URL);

  // 1. Check Purchase status
  let hasPurchased = false;

  // If the user is not authenticated, treat them as unpurchased
  if (userId) {
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(and(eq(purchases.paperId, id), eq(purchases.userId, userId)));
    if (purchase) hasPurchased = true;
  }

  // 2. Fetch Paper and Questions
  const [paperData] = await db.select().from(papers).where(eq(papers.id, id));

  if (!paperData) {
    return c.json(
      createErrorResponse(404, "Paper not found", c.req.header("X-Request-ID")),
      404,
    );
  }

  const allQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.paperId, id));

  // Apply Preview Logic
  const processedQuestions = allQuestions.map((q, index) => {
    // Show full questions for purchased papers OR the first 3 questions
    if (hasPurchased || index < 3) {
      return { ...q, is_preview: true };
    }
    // Remaining questions: return { id, order_index, is_preview: false } - no text/options
    return {
      id: q.id,
      order_index: q.orderIndex,
      is_preview: false,
    };
  });

  return c.json(
    successResponse({
      ...paperData,
      questions: processedQuestions,
    }),
    200,
  );
};

export const searchPapers = async (c: Context<{ Bindings: Env }>) => {
  const query = c.req.query("q");

  if (!query) {
    return c.json(
      createErrorResponse(
        400,
        "Search query is required",
        c.req.header("X-Request-ID"),
      ),
      400,
    );
  }

  const db = drizzle(c.env.DATABASE_URL);

  // Use tsvector search across title, subject, and topic_tag
  // We use plainto_tsquery to handle natural language search terms safely
  const results = await db.execute(drizzleSql`
    SELECT *, ts_rank(
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(subject, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(topic_tag, '')), 'C'),
      plainto_tsquery('english', ${query})
    ) AS rank
    FROM papers
    JOIN questions ON papers.id = questions.paper_id
    WHERE to_tsvector('english', coalesce(title, '') || ' ' || coalesce(subject, '') || ' ' || coalesce(topic_tag, '')) 
    @@ plainto_tsquery('english', ${query})
    ORDER BY rank DESC
    LIMIT 20;
  `);

  return c.json(successResponse(results.rows), 200);
};
