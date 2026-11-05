import { describe, expect, it, vi } from "vitest";

import { DomainForbiddenError } from "@/lib/domain/domain-errors";
import { ModerationRejectedError } from "@/lib/domain/moderation";
import {
  closePrivateLessonPost,
  createPrivateLessonPost,
  createPrivateLessonPostSchema,
  deletePrivateLessonPost,
} from "@/lib/domain/private-lessons";

vi.mock("@/lib/domain/subscription", () => ({
  getUserSubscription: vi.fn().mockResolvedValue({ isPremium: true, tier: "zigo_plus" }),
}));

describe("Private Lesson Requests Domain Suite", () => {
  describe("createPrivateLessonPostSchema validation", () => {
    it("accepts valid private lesson post payload", () => {
      const validPayload = {
        areaId: 10,
        gradeLevel: "8. Sınıf (LGS)",
        mode: "both" as const,
        city: "İstanbul",
        district: "Kadıköy",
        description: "LGS Matematik yeni nesil soru çözümü ve deneme net artışı için ders talep ediyoruz.",
        budgetTry: 600,
      };

      const parsed = createPrivateLessonPostSchema.parse(validPayload);
      expect(parsed.areaId).toBe(10);
      expect(parsed.gradeLevel).toBe("8. Sınıf (LGS)");
      expect(parsed.budgetTry).toBe(600);
    });

    it("rejects description shorter than 15 characters", () => {
      const invalidPayload = {
        areaId: 10,
        gradeLevel: "8. Sınıf",
        mode: "online" as const,
        description: "kısa açıklama",
      };

      expect(() => createPrivateLessonPostSchema.parse(invalidPayload)).toThrow(
        /en az 15 karakter/i,
      );
    });

    it("rejects non-positive areaId", () => {
      const invalidPayload = {
        areaId: 0,
        gradeLevel: "8. Sınıf",
        mode: "online" as const,
        description: "LGS Matematik yeni nesil soru çözümü için ders talep ediyoruz.",
      };

      expect(() => createPrivateLessonPostSchema.parse(invalidPayload)).toThrow();
    });
  });

  describe("createPrivateLessonPost business logic & authorization", () => {
    it("rejects non-parent role from creating a lesson post", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: "teacher" },
                error: null,
              }),
            }),
          }),
        }),
      };

      await expect(
        createPrivateLessonPost(
          mockSupabase as never,
          "teacher-123",
          {
            areaId: 10,
            gradeLevel: "8. Sınıf",
            mode: "online",
            description: "LGS Matematik yeni nesil soru çözümü için ders talep ediyoruz.",
          },
        ),
      ).rejects.toThrow(DomainForbiddenError);
    });

    it("rejects profane content in description via automated moderation", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { role: "parent" },
                error: null,
              }),
            }),
          }),
        }),
      };

      // Mock subscription returns isPremium: true so moderation is reached

      await expect(
        createPrivateLessonPost(
          mockSupabase as never,
          "parent-123",
          {
            areaId: 10,
            gradeLevel: "8. Sınıf",
            mode: "online",
            description: "bu metin aptal bir test mesajıdır ve hakaret içerir",
          },
        ),
      ).rejects.toThrow(ModerationRejectedError);
    });
  });

  describe("closePrivateLessonPost & deletePrivateLessonPost", () => {
    it("rejects non-owner from closing a lesson post", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "post-1", parent_id: "other-parent", status: "open" },
                error: null,
              }),
            }),
          }),
        }),
      };

      await expect(
        closePrivateLessonPost(mockSupabase as never, "my-parent-id", "post-1"),
      ).rejects.toThrow(/yalnızca ilan sahibi/i);
    });

    it("rejects non-owner from deleting a lesson post", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "post-1", parent_id: "other-parent" },
                error: null,
              }),
            }),
          }),
        }),
      };

      await expect(
        deletePrivateLessonPost(mockSupabase as never, "my-parent-id", "post-1"),
      ).rejects.toThrow(/yalnızca ilan sahibi/i);
    });
  });
});
