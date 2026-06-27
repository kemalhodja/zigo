import { describe, expect, it } from "vitest";

import {
  createAnswerBodySchema,
  createQuestionBodySchema,
} from "@/features/questions/types";

describe("questions schemas", () => {
  it("validates create question body", () => {
    const parsed = createQuestionBodySchema.parse({
      areaId: 2,
      title: "Limit sorusu",
      description: "Bu konuda yardıma ihtiyacım var.",
    });
    expect(parsed.areaId).toBe(2);
  });

  it("validates create answer body", () => {
    const parsed = createAnswerBodySchema.parse({
      questionId: "11111111-1111-4111-8111-111111111111",
      content: "Önce türev kurallarını tekrar edelim.",
    });
    expect(parsed.content.length).toBeGreaterThan(10);
  });
});
