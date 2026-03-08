import {
  pgTable,
  uuid,
  text,
  numeric,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
  integer,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- ENUMS ---
export const paperTypeEnum = pgEnum("paper_type", [
  "past_paper",
  "model_paper",
]);
export const examBoardEnum = pgEnum("exam_board", [
  "GCE_A",
  "GCE_O",
  "CAIE",
  "Edexcel",
]);
export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const sessionStatusEnum = pgEnum("session_status", [
  "in_progress",
  "submitted",
  "expired",
]);


// --- TABLES ---

// 1. users
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  avatarUrl: text("avatar_url"),
  gradeYear: text("grade_year"),
  preferredLanguage: text("preferred_language"),
  twoFaEnabled: boolean("two_fa_enabled").default(false),
  twoFaSecret: text("two_fa_secret"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. papers
export const papers = pgTable(
  "papers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    type: paperTypeEnum("type").notNull(),
    subject: text("subject").notNull(),
    examBoard: examBoardEnum("exam_board").notNull(),
    language: text("language").notNull(),
    year: integer("year"),
    priceLkr: numeric("price_lkr").notNull(),
    isPublished: boolean("is_published").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // Requirement: Indexes on subject, exam_board, language, type
    searchIdx: index("papers_search_idx").on(
      table.subject,
      table.examBoard,
      table.language,
      table.type,
    ),
  }),
);

// 3. questions
export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  paperId: uuid("paper_id")
    .notNull()
    .references(() => papers.id, { onDelete: "cascade" }), // Cascade FK
  questionText: text("question_text").notNull(),
  options: jsonb("options").notNull(), // Array of {id, text}
  correctOptionId: text("correct_option_id").notNull(),
  explanation: text("explanation"),
  difficulty: difficultyEnum("difficulty").notNull(),
  topicTag: text("topic_tag"),
  orderIndex: integer("order_index").notNull(),
});

// 4. purchases
export const purchases = pgTable(
  "purchases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    paperId: uuid("paper_id")
      .notNull()
      .references(() => papers.id, { onDelete: "cascade" }),
    amountPaidLkr: numeric("amount_paid_lkr").notNull(),
    paymentMethod: text("payment_method"),
    paymentRef: text("payment_ref"),
    purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
  },
  (table) => ({
    // Requirement: Enforce UNIQUE(user_id, paper_id)
    userPaperUnique: unique("user_paper_unique").on(
      table.userId,
      table.paperId,
    ),
    // Requirement: Index on user_id
    userIdx: index("purchases_user_idx").on(table.userId),
  }),
);

// 5. exam_sessions
export const examSessions = pgTable(
  "exam_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    paperId: uuid("paper_id")
      .notNull()
      .references(() => papers.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    submittedAt: timestamp("submitted_at"),
    scorePct: numeric("score_pct"),
    status: sessionStatusEnum("status").default("in_progress").notNull(),
  },
  (table) => ({
    // Requirement: Index on user_id, status
    userStatusIdx: index("session_user_status_idx").on(
      table.userId,
      table.status,
    ),
  }),
);

// 6. session_answers
export const sessionAnswers = pgTable(
  "session_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => examSessions.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    selectedOptionId: text("selected_option_id"),
    isCorrect: boolean("is_correct"),
    answeredAt: timestamp("answered_at").defaultNow().notNull(),
  },
  (table) => ({
    // Requirement: Enforce UNIQUE(session_id, question_id)
    sessionQuestionUnique: unique("session_question_unique").on(
      table.sessionId,
      table.questionId,
    ),
  }),
);


// 1. Paper Relations
export const papersRelations = relations(papers, ({ many }) => ({
  questions: many(questions),
  examSessions: many(examSessions),
}));

// 2. Question Relations
export const questionsRelations = relations(questions, ({ one }) => ({
  paper: one(papers, {
    fields: [questions.paperId],
    references: [papers.id],
  }),
}));

// 3. Exam Session Relations
export const examSessionsRelations = relations(examSessions, ({ one, many }) => ({
  paper: one(papers, {
    fields: [examSessions.paperId],
    references: [papers.id],
  }),
  answers: many(sessionAnswers),
}));