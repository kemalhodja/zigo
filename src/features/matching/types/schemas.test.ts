import { describe, expect, it } from "vitest";

import { matchedTeacherSchema, upsertStudentNeedBodySchema } from "@/features/matching/types";

describe("matching schemas", () => {
  it("validates student need body", () => {
    const parsed = upsertStudentNeedBodySchema.parse({
      childProfileId: "11111111-1111-4111-8111-111111111111",
      areaId: 3,
      weaknessLevel: 4,
    });
    expect(parsed.weaknessLevel).toBe(4);
  });

  it("validates matched teacher shape", () => {
    const parsed = matchedTeacherSchema.parse({
      teacher_id: "11111111-1111-4111-8111-111111111111",
      full_name: "Ada",
      reputation_score: 80,
      matched_area_id: 1,
      area_name: "Matematik",
      weakness_level: 3,
      match_score: 92,
    });
    expect(parsed.match_score).toBe(92);
  });
});
