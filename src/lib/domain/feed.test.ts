import { describe, expect, it } from "vitest";

import { createPostSchema } from "@/lib/domain/feed";

describe("feed schemas", () => {
  it("accepts a valid teacher post payload", () => {
    const parsed = createPostSchema.parse({
      teacherId: "00000000-0000-4000-8000-000000000101",
      areaId: 1,
      title: "Kesirler özeti",
      content: "Payda eşitlemeyi unutmayın.",
      mediaUrl: "https://cdn.example.com/lesson.mp4",
    });

    expect(parsed.areaId).toBe(1);
    expect(parsed.title).toBe("Kesirler özeti");
  });

  it("rejects posts without a teacher id", () => {
    expect(() =>
      createPostSchema.parse({
        areaId: 1,
        title: "Kesirler",
        content: "Notlar",
      }),
    ).toThrow();
  });

  it("rejects empty titles", () => {
    expect(() =>
      createPostSchema.parse({
        teacherId: "00000000-0000-4000-8000-000000000101",
        areaId: 1,
        title: "  ",
        content: "Notlar",
      }),
    ).toThrow();
  });
});
