import { describe, expect, it } from "vitest";

import {
  createAnswerSchema,
  createQuestion,
  createQuestionSchema,
  createTeacherAnswer,
  getMatchedQuestions,
} from "@/lib/domain/questions";
import { createMockSupabase } from "@/test/mock-supabase";

describe("questions schemas", () => {
  it("accepts valid question payload", () => {
    const parsed = createQuestionSchema.parse({
      authorId: "00000000-0000-4000-8000-000000000301",
      areaId: 1,
      title: "Kesirler sorusu",
      description: "Paydalar eşit değilken ne yapmalıyım?",
    });
    expect(parsed.title).toBe("Kesirler sorusu");
  });

  it("rejects short descriptions", () => {
    expect(() =>
      createQuestionSchema.parse({
        authorId: "00000000-0000-4000-8000-000000000301",
        areaId: 1,
        title: "Kısa",
        description: "kısa",
      }),
    ).toThrow();
  });

  it("accepts teacher answer payload", () => {
    const parsed = createAnswerSchema.parse({
      questionId: "00000000-0000-4000-8000-000000000501",
      teacherId: "00000000-0000-4000-8000-000000000101",
      content: "Önce paydaları eşitleyip sonra payları topluyoruz.",
    });
    expect(parsed.content.length).toBeGreaterThanOrEqual(10);
  });
});

describe("questions domain", () => {
  it("returns empty list when user has no interests", async () => {
    const supabase = createMockSupabase({
      tables: {
        user_interests: { data: [], error: null },
      },
    });

    const questions = await getMatchedQuestions(supabase, "00000000-0000-4000-8000-000000000301");
    expect(questions).toEqual([]);
  });

  it("loads questions only from matched areas", async () => {
    const supabase = createMockSupabase({
      tables: {
        user_interests: { data: [{ area_id: 1 }], error: null },
        questions: {
          data: [{ id: "q1", area_id: 1, title: "Soru 1" }],
          error: null,
        },
      },
    });

    const questions = await getMatchedQuestions(supabase, "00000000-0000-4000-8000-000000000301");
    expect(questions).toHaveLength(1);
  });

  it("creates moderated questions", async () => {
    const supabase = createMockSupabase({
      tables: {
        users: {
          data: { social_interactions_blocked: false },
          error: null,
        },
        questions: {
          data: {
            id: "00000000-0000-4000-8000-000000000501",
            title: "Kesirler sorusu",
          },
          error: null,
        },
      },
    });

    const question = await createQuestion(supabase, {
      authorId: "00000000-0000-4000-8000-000000000301",
      areaId: 1,
      title: "Kesirler sorusu",
      description: "Paydalar eşit değilken ne yapmalıyım?",
    });

    expect(question.title).toBe("Kesirler sorusu");
  });

  it("creates moderated teacher answers", async () => {
    const supabase = createMockSupabase({
      tables: {
        users: {
          data: { social_interactions_blocked: false },
          error: null,
        },
        answers: {
          data: {
            id: "00000000-0000-4000-8000-000000000502",
            content: "Önce paydaları eşitleyip sonra payları topluyoruz.",
          },
          error: null,
        },
      },
    });

    const answer = await createTeacherAnswer(supabase, {
      questionId: "00000000-0000-4000-8000-000000000501",
      teacherId: "00000000-0000-4000-8000-000000000101",
      content: "Önce paydaları eşitleyip sonra payları topluyoruz.",
    });

    expect(answer.content).toContain("paydaları");
  });
});
