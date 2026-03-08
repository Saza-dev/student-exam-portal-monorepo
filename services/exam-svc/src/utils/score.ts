export interface SessionAnswer {
  selectedOptionId: string | null;
  questionId: string;
}
export interface Question {
  id: string;
  correctOptionId: string;
}

export const computeScore = (
  answers: SessionAnswer[],
  questions: Question[],
): number => {
  if (questions.length === 0) return 0;

  const correctCount = answers.reduce((acc, answer) => {
    const question = questions.find((q) => q.id === answer.questionId);
    return question && answer.selectedOptionId === question.correctOptionId
      ? acc + 1
      : acc;
  }, 0);

  return (correctCount / questions.length) * 100;
};
