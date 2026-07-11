import { describe, expect, it, vi } from "vitest";

import {
  getClassGroupInfo,
  joinClassGroup,
  joinClassGroupSchema,
  leaveClassGroup,
  leaveClassGroupSchema,
} from "@/lib/domain/class-groups";
import { createMockSupabase } from "@/test/mock-supabase";

describe("class-groups schemas", () => {
  it("validates joinClassGroupSchema successfully for complete location data", () => {
    const valid = joinClassGroupSchema.parse({
      city: "İstanbul",
      district: "Kadıköy",
      schoolName: "Atatürk Ortaokulu",
      gradeLevel: "5-8. Sınıf",
    });
    expect(valid.city).toBe("İstanbul");
    expect(valid.childProfileId).toBeUndefined();
  });

  it("fails joinClassGroupSchema for short or empty input strings", () => {
    expect(() =>
      joinClassGroupSchema.parse({
        city: "A",
        district: "Kadıköy",
        schoolName: "Atatürk Ortaokulu",
        gradeLevel: "5-8. Sınıf",
      }),
    ).toThrow();
  });

  it("validates leaveClassGroupSchema successfully with groupId UUID", () => {
    const parsed = leaveClassGroupSchema.parse({
      groupId: "11111111-1111-4111-8111-111111111111",
      childProfileId: "22222222-2222-4222-8222-222222222222",
    });
    expect(parsed.groupId).toBe("11111111-1111-4111-8111-111111111111");
  });
});

describe("class-groups functions", () => {
  it("getClassGroupInfo returns empty group info when user location is incomplete", async () => {
    const supabase = createMockSupabase({});
    const mockFrom = vi.fn((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { city: "Ankara", district: null, school_name: null, grade_level: null },
                error: null,
              }),
            }),
          }),
        };
      }
      return { select: vi.fn() };
    });
    supabase.from = mockFrom as unknown as typeof supabase.from;

    const info = await getClassGroupInfo(supabase, "user-id-1");
    expect(info.isJoined).toBe(false);
    expect(info.group).toBeNull();
    expect(info.userLocation.city).toBe("Ankara");
  });

  it("joinClassGroup calls join_class_group rpc with parsed parameters", async () => {
    const supabase = createMockSupabase({});
    supabase.rpc = vi.fn().mockResolvedValue({
      data: { id: "group-uuid-1", group_name: "5-8. Sınıf" },
      error: null,
    });

    const result = await joinClassGroup(supabase, {
      city: "İzmir",
      district: "Karşıyaka",
      schoolName: "Zigo Lisesi",
      gradeLevel: "9-12. Sınıf",
    });

    expect(supabase.rpc).toHaveBeenCalledWith("join_class_group", {
      p_city: "İzmir",
      p_district: "Karşıyaka",
      p_school_name: "Zigo Lisesi",
      p_grade_level: "9-12. Sınıf",
      p_child_profile_id: null,
    });
    expect(result).toEqual({ id: "group-uuid-1", group_name: "5-8. Sınıf" });
  });

  it("leaveClassGroup calls leave_class_group rpc with parsed parameters", async () => {
    const supabase = createMockSupabase({});
    supabase.rpc = vi.fn().mockResolvedValue({
      data: true,
      error: null,
    });

    const result = await leaveClassGroup(supabase, {
      groupId: "11111111-1111-4111-8111-111111111111",
    });

    expect(supabase.rpc).toHaveBeenCalledWith("leave_class_group", {
      p_group_id: "11111111-1111-4111-8111-111111111111",
      p_child_profile_id: null,
    });
    expect(result).toBe(true);
  });
});
