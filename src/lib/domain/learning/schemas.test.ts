import { describe, expect, it } from "vitest";

import {
  createQuizSchema,
  TEACHER_QUIZ_QUESTION_COUNT,
} from "@/lib/domain/learning/schemas";

function buildQuestion(suffix: string, correctOption = 0) {
  return {
    questionText: `Bu profesyonel soru metni yeterli uzunlukta ${suffix}`,
    options: [`A-${suffix}`, `B-${suffix}`, `C-${suffix}`, `D-${suffix}`],
    correctOption,
  };
}

describe("createQuizSchema", () => {
  it("requires exactly 10 A-D questions", () => {
    const parsed = createQuizSchema.parse({
      teacherId: "11111111-1111-4111-8111-111111111111",
      areaId: 3,
      title: "TYT Matematik Mini Deneme",
      pointsReward: 100,
      questions: Array.from({ length: TEACHER_QUIZ_QUESTION_COUNT }, (_, index) =>
        buildQuestion(String(index + 1), index % 4),
      ),
    });

    expect(parsed.questions).toHaveLength(10);
    expect(parsed.questions[0]?.options).toHaveLength(4);
    expect(parsed.pointsReward).toBe(100);
  });

  it("rejects fewer than 10 questions", () => {
    expect(() =>
      createQuizSchema.parse({
        teacherId: "11111111-1111-4111-8111-111111111111",
        areaId: 3,
        title: "Eksik quiz",
        questions: [buildQuestion("1")],
      }),
    ).toThrow();
  });

  it("rejects duplicate options in a question", () => {
    expect(() =>
      createQuizSchema.parse({
        teacherId: "11111111-1111-4111-8111-111111111111",
        areaId: 3,
        title: "Çakışan seçenekler",
        questions: Array.from({ length: TEACHER_QUIZ_QUESTION_COUNT }, (_, index) => ({
          questionText: `Bu profesyonel soru metni yeterli uzunlukta ${index + 1}`,
          options: ["Aynı", "Aynı", "C", "D"],
          correctOption: 2,
        })),
      }),
    ).toThrow();
  });
});
