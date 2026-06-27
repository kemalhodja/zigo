import { describe, expect, it } from "vitest";

import { bookSlotSchema, createAvailabilitySlotSchema } from "@/lib/domain/ecosystem/calendar";
import { upsertStudentNeedSchema } from "@/lib/domain/ecosystem/matching";
import { createLessonRequestSchema } from "@/lib/domain/lesson-requests/schemas";

describe("ecosystem schemas", () => {
  it("validates availability slot times", () => {
    const parsed = createAvailabilitySlotSchema.parse({
      teacherId: "11111111-1111-4111-8111-111111111111",
      startTime: "2026-06-25T10:00:00.000Z",
      endTime: "2026-06-25T11:00:00.000Z",
    });
    expect(parsed.teacherId).toBeTruthy();
  });

  it("validates booking payload", () => {
    const parsed = bookSlotSchema.parse({
      slotId: "22222222-2222-4222-8222-222222222222",
      parentId: "33333333-3333-4333-8333-333333333333",
      childProfileId: "44444444-4444-4444-8444-444444444444",
      areaId: 1,
    });
    expect(parsed.areaId).toBe(1);
  });

  it("validates student need weakness range", () => {
    expect(() =>
      upsertStudentNeedSchema.parse({
        childProfileId: "44444444-4444-4444-8444-444444444444",
        areaId: 1,
        weaknessLevel: 6,
      }),
    ).toThrow();
  });

  it("accepts urgent lesson request priority", () => {
    const parsed = createLessonRequestSchema.parse({
      senderId: "33333333-3333-4333-8333-333333333333",
      receiverId: "11111111-1111-4111-8111-111111111111",
      messageBody: "Acil matematik desteği gerekiyor lütfen.",
      priority: "urgent",
    });
    expect(parsed.priority).toBe("urgent");
  });
});
