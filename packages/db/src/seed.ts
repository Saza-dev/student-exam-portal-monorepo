import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  users,
  papers,
  questions,
  examSessions,
  sessionAnswers,
} from "./schema";

async function main() {
  // Connect to the database (Replace with your actual Neon connection string when running)
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://neondb_owner:npg_L9pny1dTJjbB@ep-misty-salad-a1a5sg1z-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
  const queryClient = postgres(connectionString);
  const db = drizzle(queryClient);

  console.log("Seeding database...");

  // 1. Insert 2 Users
  const insertedUsers = await db
    .insert(users)
    .values([
      {
        email: "student1@examportal.com",
        passwordHash: "hashed_pw_1",
        fullName: "Alice Student",
      },
      {
        email: "student2@examportal.com",
        passwordHash: "hashed_pw_2",
        fullName: "Bob Student",
      },
    ])
    .returning();

  const user1Id = insertedUsers[0].id;

  // 2. Insert 1 Paper
  const insertedPapers = await db
    .insert(papers)
    .values([
      {
        title: "2026 Model Paper - AI Foundations",
        type: "model_paper",
        subject: "Computer Science",
        examBoard: "GCE_A",
        language: "English",
        priceLkr: "1500",
        isPublished: true,
      },
    ])
    .returning();

  const paperId = insertedPapers[0].id;

  // 3. Insert 5 Questions for the Paper
  const insertedQuestions = await db
    .insert(questions)
    .values([
      {
        paperId,
        questionText: "What is a neural network?",
        options: [
          { id: "A", text: "Algorithm" },
          { id: "B", text: "Hardware" },
        ],
        correctOptionId: "A",
        difficulty: "easy",
        orderIndex: 1,
      },
      {
        paperId,
        questionText: "Define backpropagation.",
        options: [
          { id: "A", text: "Forward pass" },
          { id: "B", text: "Error calculation" },
        ],
        correctOptionId: "B",
        difficulty: "medium",
        orderIndex: 2,
      },
      {
        paperId,
        questionText: "What is overfitting?",
        options: [
          { id: "A", text: "Good generalization" },
          { id: "B", text: "Memorizing noise" },
        ],
        correctOptionId: "B",
        difficulty: "medium",
        orderIndex: 3,
      },
      {
        paperId,
        questionText: "What is a tensor?",
        options: [
          { id: "A", text: "Multi-dimensional array" },
          { id: "B", text: "Scalar" },
        ],
        correctOptionId: "A",
        difficulty: "hard",
        orderIndex: 4,
      },
      {
        paperId,
        questionText: "What does CNN stand for?",
        options: [
          { id: "A", text: "Convolutional Neural Network" },
          { id: "B", text: "Computer Node Network" },
        ],
        correctOptionId: "A",
        difficulty: "easy",
        orderIndex: 5,
      },
    ])
    .returning();

  // 4. Insert 1 Completed Exam Session
  const session = await db
    .insert(examSessions)
    .values([
      {
        userId: user1Id,
        paperId: paperId,
        expiresAt: new Date(Date.now() - 100000), // set expiry in the past since it's completed
        status: "submitted",
        scorePct: "80.00",
        submittedAt: new Date(),
      },
    ])
    .returning();

  const sessionId = session[0].id;

  // 5. Insert Session Answers for the completed session
  await db.insert(sessionAnswers).values([
    {
      sessionId,
      questionId: insertedQuestions[0].id,
      selectedOptionId: "A",
      isCorrect: true,
    },
    {
      sessionId,
      questionId: insertedQuestions[1].id,
      selectedOptionId: "B",
      isCorrect: true,
    },
    {
      sessionId,
      questionId: insertedQuestions[2].id,
      selectedOptionId: "B",
      isCorrect: true,
    },
    {
      sessionId,
      questionId: insertedQuestions[3].id,
      selectedOptionId: "A",
      isCorrect: true,
    },
    {
      sessionId,
      questionId: insertedQuestions[4].id,
      selectedOptionId: "B",
      isCorrect: false,
    }, // Intentionally wrong answer
  ]);

  console.log("Seeding complete! ✅");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
