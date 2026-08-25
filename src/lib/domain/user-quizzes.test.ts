import { describe, expect, it } from "vitest";

import {
  toSolvePayload,
  type UserQuizQuestion,
  userQuizSchema,
} from "@/lib/domain/user-quizzes";

const validQuestion: UserQuizQuestion = {
  text: "2 + 2 kaçtır?",
  options: ["3", "4", "5", "6"],
  correctIndex: 1,
};

describe("userQuizSchema", () => {
  it("accepts a well-formed quiz", () => {
    const parsed = userQuizSchema.safeParse({
      title: "Matematik Challenge",
      questions: [validQuestion, validQuestion, validQuestion],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects fewer than 3 questions", () => {
    const parsed = userQuizSchema.safeParse({
      title: "Kısa",
      questions: [validQuestion, validQuestion],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects questions without exactly 4 options", () => {
    const parsed = userQuizSchema.safeParse({
      title: "Bozuk quiz",
      questions: [
        { ...validQuestion, options: ["1", "2"] },
        validQuestion,
        validQuestion,
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects out-of-range correctIndex at parse time only via bounds", () => {
    // correctIndex must be 0..3; pointing beyond options is caught server-side.
    const parsed = userQuizSchema.safeParse({
      title: "Sınır testi",
      questions: [{ ...validQuestion, correctIndex: 7 }, validQuestion, validQuestion],
    });
    expect(parsed.success).toBe(false);
  });
});

describe("toSolvePayload", () => {
  it("strips answer keys from questions", () => {
    const payload = toSolvePayload({
      id: "q-1",
      title: "T",
      description: null,
      questions: [validQuestion],
    });

    expect(payload.totalQuestions).toBe(1);
    expect(payload.questions[0]).not.toHaveProperty("correctIndex");
    expect(payload.questions[0].options).toEqual(["3", "4", "5", "6"]);
  });
});
