import { describe, expect, it } from "vitest";

import {
  toSolvePayload,
  type UserQuizQuestion,
  userQuizSchema,
} from "@/lib/domain/user-quizzes";

const valid4OptQuestion: UserQuizQuestion = {
  text: "2 + 2 kaçtır?",
  options: ["3", "4", "5", "6"],
  correctIndex: 1,
  type: "multiple_choice",
  difficulty: "easy",
  explanation: "2 ile 2'nin toplamı 4 eder.",
};

const valid5OptQuestion: UserQuizQuestion = {
  text: "Hangisi Türkiye'nin başkentidir?",
  options: ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya"],
  correctIndex: 1,
  type: "multiple_choice",
  difficulty: "medium",
};

const validTrueFalseQuestion: UserQuizQuestion = {
  text: "Su 100 derecede kaynar.",
  options: ["Doğru", "Yanlış"],
  correctIndex: 0,
  type: "true_false",
  difficulty: "easy",
};

const valid3OptQuestion: UserQuizQuestion = {
  text: "Güneş hangi yönden doğar?",
  options: ["Doğu", "Batı", "Kuzey"],
  correctIndex: 0,
  type: "multiple_choice",
  difficulty: "easy",
};

describe("userQuizSchema", () => {
  it("accepts a well-formed quiz with mixed question alternatives (2, 3, 4, 5 options)", () => {
    const parsed = userQuizSchema.safeParse({
      title: "MEB Karma Deneme Sınavı",
      difficulty: "mixed",
      questions: [validTrueFalseQuestion, valid3OptQuestion, valid4OptQuestion, valid5OptQuestion],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts 5-option YKS format questions with correctIndex 4", () => {
    const parsed = userQuizSchema.safeParse({
      title: "YKS Biyoloji Denemesi",
      questions: [
        { ...valid5OptQuestion, correctIndex: 4 },
        valid5OptQuestion,
        valid5OptQuestion,
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects fewer than 3 questions", () => {
    const parsed = userQuizSchema.safeParse({
      title: "Kısa",
      questions: [valid4OptQuestion, valid4OptQuestion],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects questions with only 1 option", () => {
    const parsed = userQuizSchema.safeParse({
      title: "Tek seçenek",
      questions: [
        { ...valid4OptQuestion, options: ["Yalnız A"] },
        valid4OptQuestion,
        valid4OptQuestion,
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects questions with more than 5 options (e.g. 6 options)", () => {
    const parsed = userQuizSchema.safeParse({
      title: "6 seçenek",
      questions: [
        { ...valid4OptQuestion, options: ["A", "B", "C", "D", "E", "F"] },
        valid4OptQuestion,
        valid4OptQuestion,
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects out-of-range correctIndex (e.g. 5 or higher)", () => {
    const parsed = userQuizSchema.safeParse({
      title: "Sınır testi",
      questions: [{ ...valid4OptQuestion, correctIndex: 5 }, valid4OptQuestion, valid4OptQuestion],
    });
    expect(parsed.success).toBe(false);
  });
});

describe("toSolvePayload", () => {
  it("strips answer keys and explanation from questions but includes metadata", () => {
    const payload = toSolvePayload({
      id: "q-1",
      title: "LGS Matematik",
      description: "Yeni nesil sorular",
      difficulty: "hard",
      questions: [valid4OptQuestion, validTrueFalseQuestion],
    });

    expect(payload.totalQuestions).toBe(2);
    expect(payload.difficulty).toBe("hard");
    expect(payload.questions[0]).not.toHaveProperty("correctIndex");
    expect(payload.questions[0]).not.toHaveProperty("explanation");
    expect(payload.questions[0].options).toEqual(["3", "4", "5", "6"]);
    expect(payload.questions[0].difficulty).toBe("easy");
    expect(payload.questions[1].type).toBe("true_false");
    expect(payload.questions[1].options).toEqual(["Doğru", "Yanlış"]);
  });
});
