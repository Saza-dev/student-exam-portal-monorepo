import { describe, it, expect } from "vitest";
import { computeScore } from "./score";

const mockQuestions = [
  { id: "1", correctOptionId: "A" },
  { id: "2", correctOptionId: "B" },
];

describe("Exam Scoring (Requirement 2)", () => {
  it("should return 100 for all correct answers", () => {
    const answers = [
      { questionId: "1", selectedOptionId: "A" },
      { questionId: "2", selectedOptionId: "B" },
    ];
    expect(computeScore(answers, mockQuestions)).toBe(100);
  });

  it("should return 0 for all wrong answers", () => {
    const answers = [
      { questionId: "1", selectedOptionId: "B" },
      { questionId: "2", selectedOptionId: "A" },
    ];
    expect(computeScore(answers, mockQuestions)).toBe(0);
  });

  it("should return 50 for partial correctness", () => {
    const answers = [
      { questionId: "1", selectedOptionId: "A" },
      { questionId: "2", selectedOptionId: "A" },
    ];
    expect(computeScore(answers, mockQuestions)).toBe(50);
  });

  it("should return 0 for an empty answers array", () => {
    expect(computeScore([], mockQuestions)).toBe(0);
  });

  it("should treat null selected_option_id as wrong", () => {
    const answers = [{ questionId: "1", selectedOptionId: null }];
    expect(computeScore(answers, mockQuestions)).toBe(0);
  });
});
