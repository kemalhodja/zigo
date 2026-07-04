import { describe, expect, it } from "vitest";

import { submitQuizSchema } from "@/lib/domain/learning";

describe("learning schemas", () => {
  it("accepts legacy single-option quiz submissions", () => {
    const parsed = submitQuizSchema.parse({
      quizId: "00000000-0000-4000-8000-000000000301",
      selectedOption: 2,
    });

    expect(parsed.selectedOption).toBe(2);
  });

  it("accepts multi-answer quiz submissions", () => {
    const parsed = submitQuizSchema.parse({
      quizId: "00000000-0000-4000-8000-000000000301",
      answers: [
        {
          questionId: "00000000-0000-4000-8000-000000000401",
          selectedOption: 1,
        },
        {
          questionId: "00000000-0000-4000-8000-000000000402",
          selectedOption: 0,
        },
      ],
    });

    expect(parsed.answers).toHaveLength(2);
  });

  it("requires either selectedOption or answers", () => {
    expect(() =>
      submitQuizSchema.parse({
        quizId: "00000000-0000-4000-8000-000000000301",
      }),
    ).toThrow();
  });
});
