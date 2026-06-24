import { describe, expect, it, vi } from "vitest";

import { createComment } from "@/lib/domain/social/interactions";
import {
  commentSchema,
  contentReportSchema,
  createSocialPostSchema,
  reelWatchCompletionSchema,
} from "@/lib/domain/social/schemas";
import { createMockSupabase } from "@/test/mock-supabase";

describe("social interactions schemas", () => {
  it("accepts valid create post payload", () => {
    const parsed = createSocialPostSchema.parse({
      caption: "Bugün kesirleri tekrar ediyoruz.",
      areaId: 1,
      mediaType: "video",
      isReel: true,
    });

    expect(parsed.areaId).toBe(1);
    expect(parsed.isReel).toBe(true);
  });

  it("rejects posts without caption", () => {
    expect(() =>
      createSocialPostSchema.parse({
        caption: "  ",
        areaId: 1,
      }),
    ).toThrow();
  });

  it("requires at least 60 watched seconds for reel completion", () => {
    expect(() =>
      reelWatchCompletionSchema.parse({
        postId: "00000000-0000-4000-8000-000000000601",
        secondsWatched: 30,
      }),
    ).toThrow();
  });

  it("accepts reel completion at 60 seconds", () => {
    const parsed = reelWatchCompletionSchema.parse({
      postId: "00000000-0000-4000-8000-000000000601",
      secondsWatched: 60,
    });
    expect(parsed.secondsWatched).toBe(60);
  });

  it("defaults report reason to safety_review", () => {
    const parsed = contentReportSchema.parse({
      postId: "00000000-0000-4000-8000-000000000601",
    });
    expect(parsed.reason).toBe("safety_review");
  });
});

describe("createComment moderation status", () => {
  it("marks student comments as pending moderation", async () => {
    const insertPayload = vi.fn();
    const supabase = createMockSupabase({
      tables: {
        post_comments: { data: null, error: null },
        social_posts: {
          data: { author_id: "00000000-0000-4000-8000-000000000101" },
          error: null,
        },
        users: {
          data: { social_interactions_blocked: false },
          error: null,
        },
        notifications: { data: null, error: null },
      },
    });

    const originalFrom = supabase.from.bind(supabase);
    supabase.from = vi.fn((table: string) => {
      const builder = originalFrom(table) as unknown as Record<string, unknown>;
      if (table === "post_comments") {
        builder.insert = vi.fn((payload: unknown) => {
          insertPayload(payload);
          return {
            select: () => ({
              single: async () => ({
                data: {
                  id: "00000000-0000-4000-8000-000000000701",
                  ...(payload as object),
                },
                error: null,
              }),
            }),
          };
        });
      }
      return builder;
    }) as unknown as typeof supabase.from;

    await createComment(supabase, {
      postId: "00000000-0000-4000-8000-000000000601",
      userId: "00000000-0000-4000-8000-000000000301",
      userRole: "student",
      content: "Harika ders!",
    });

    expect(insertPayload).toHaveBeenCalledWith(
      expect.objectContaining({ moderation_status: "pending" }),
    );
  });

  it("approves teacher comments immediately", async () => {
    const insertPayload = vi.fn();
    const supabase = createMockSupabase({
      tables: {
        post_comments: { data: null, error: null },
        social_posts: {
          data: { author_id: "00000000-0000-4000-8000-000000000101" },
          error: null,
        },
        users: {
          data: { social_interactions_blocked: false },
          error: null,
        },
        notifications: { data: null, error: null },
      },
    });

    const originalFrom = supabase.from.bind(supabase);
    supabase.from = vi.fn((table: string) => {
      const builder = originalFrom(table) as unknown as Record<string, unknown>;
      if (table === "post_comments") {
        builder.insert = vi.fn((payload: unknown) => {
          insertPayload(payload);
          return {
            select: () => ({
              single: async () => ({
                data: { id: "c1", ...(payload as object) },
                error: null,
              }),
            }),
          };
        });
      }
      return builder;
    }) as unknown as typeof supabase.from;

    await createComment(supabase, {
      postId: "00000000-0000-4000-8000-000000000601",
      userId: "00000000-0000-4000-8000-000000000101",
      userRole: "teacher",
      content: "Sorunuza cevap verdim.",
    });

    expect(insertPayload).toHaveBeenCalledWith(
      expect.objectContaining({ moderation_status: "approved" }),
    );
  });

  it("queues teacher comments with suspicious patterns for review", async () => {
    const insertPayload = vi.fn();
    const supabase = createMockSupabase({
      tables: {
        post_comments: { data: null, error: null },
        social_posts: {
          data: { author_id: "00000000-0000-4000-8000-000000000101" },
          error: null,
        },
        users: {
          data: { social_interactions_blocked: false },
          error: null,
        },
        notifications: { data: null, error: null },
      },
    });

    const originalFrom = supabase.from.bind(supabase);
    supabase.from = vi.fn((table: string) => {
      const builder = originalFrom(table) as unknown as Record<string, unknown>;
      if (table === "post_comments") {
        builder.insert = vi.fn((payload: unknown) => {
          insertPayload(payload);
          return {
            select: () => ({
              single: async () => ({
                data: { id: "c2", ...(payload as object) },
                error: null,
              }),
            }),
          };
        });
      }
      return builder;
    }) as unknown as typeof supabase.from;

    await createComment(supabase, {
      postId: "00000000-0000-4000-8000-000000000601",
      userId: "00000000-0000-4000-8000-000000000101",
      userRole: "teacher",
      content: "hellooooooo",
    });

    expect(insertPayload).toHaveBeenCalledWith(
      expect.objectContaining({ moderation_status: "pending" }),
    );
  });

  it("validates comment schema bounds", () => {
    expect(() =>
      commentSchema.parse({
        postId: "00000000-0000-4000-8000-000000000601",
        content: "",
      }),
    ).toThrow();
  });
});
