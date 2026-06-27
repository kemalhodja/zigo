import { describe, expect, it } from "vitest";

import { dbLessonBookingSchema, dbUserSchema } from "@/features/shared/types/db-schemas";

describe("db-schemas", () => {
  it("parses a user row", () => {
    const parsed = dbUserSchema.parse({
      id: "11111111-1111-4111-8111-111111111111",
      email: "parent@zigo.app",
      full_name: "Veli User",
      role: "parent",
      is_verified: false,
      total_points: 10,
      created_at: "2026-01-01T00:00:00.000Z",
    });
    expect(parsed.role).toBe("parent");
  });

  it("parses a lesson booking row", () => {
    const parsed = dbLessonBookingSchema.parse({
      id: "22222222-2222-4222-8222-222222222222",
      teacher_id: "11111111-1111-4111-8111-111111111111",
      parent_id: "33333333-3333-4333-8333-333333333333",
      child_profile_id: null,
      start_time: "2026-06-24T10:00:00.000Z",
      end_time: "2026-06-24T11:00:00.000Z",
      status: "booked",
      area_id: 2,
    });
    expect(parsed.status).toBe("booked");
  });
});
