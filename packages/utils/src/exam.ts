/**
 * Compute exam score based on answers
 * @param answers - Array of submitted answers
 * @param questions - Array of questions with correct options
 * @returns Score as percentage (0-100)
 */
export function computeScore(
  answers: Array<{ questionId: string; selectedOptionId: string | null }>,
  questions: Array<{
    id: string;
    correctOptionId: string;
  }>,
): number {
  let correct = 0;
  const totalQuestions = questions.length;

  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId);
    if (question && answer.selectedOptionId === question.correctOptionId) {
      correct++;
    }
  }

  return totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
}

/**
 * Validate if a session has expired
 */
export function isSessionExpired(expiresAt: Date | string): boolean {
  const expiryDate =
    typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return new Date() > expiryDate;
}

/**
 * Calculate time remaining for a session in seconds
 */
export function getTimeRemaining(expiresAt: Date | string): number {
  const expiryDate =
    typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  const remaining = expiryDate.getTime() - new Date().getTime();
  return Math.max(0, Math.floor(remaining / 1000));
}
