import { describe, expect, it } from "vitest";

import { getUserSafetyQueue, moderateSafetyQueueItem, updateContentReportStatus } from "@/lib/domain/social/safety";
import { contentReportSchema, contentReportStatusSchema, moderationActionSchema } from "@/lib/domain/social/schemas";
import { createMockSupabase } from "@/test/mock-supabase";

describe("social safety schemas", () => {
  it("accepts moderation queue actions", () => {
    const parsed = moderationActionSchema.parse({
      itemId: "00000000-0000-4000-8000-000000000801",
      kind: "comment",
      status: "approved",
    });
    expect(parsed.kind).toBe("comment");
  });

  it("rejects invalid moderation status", () => {
    expect(() =>
      moderationActionSchema.parse({
        itemId: "00000000-0000-4000-8000-000000000801",
        kind: "comment",
        status: "hidden",
      }),
    ).toThrow();
  });

  it("limits report details length", () => {
    expect(() =>
      contentReportSchema.parse({
        postId: "00000000-0000-4000-8000-000000000601",
        details: "x".repeat(501),
      }),
    ).toThrow();
  });

  it("accepts report status transitions", () => {
    const parsed = contentReportStatusSchema.parse({
      reportId: "00000000-0000-4000-8000-000000000901",
      status: "reviewing",
    });
    expect(parsed.status).toBe("reviewing");
  });
});

describe("safety queue mapping", () => {
  it("merges pending comments and story replies for a user", async () => {
    const supabase = createMockSupabase({
      tables: {
        post_comments: {
          data: [
            {
              id: "c1",
              content: "Bekleyen yorum",
              moderation_status: "pending",
              created_at: "2026-01-02T00:00:00.000Z",
            },
          ],
          error: null,
        },
        story_replies: {
          data: [
            {
              id: "r1",
              content: "Bekleyen spark cevabı",
              moderation_status: "pending",
              created_at: "2026-01-03T00:00:00.000Z",
            },
          ],
          error: null,
        },
      },
    });

    const queue = await getUserSafetyQueue(supabase, "00000000-0000-4000-8000-000000000301");
    expect(queue).toHaveLength(2);
    expect(queue[0]?.kind).toBe("story_reply");
    expect(queue[1]?.kind).toBe("comment");
  });

  it("updates moderation status through moderateSafetyQueueItem", async () => {
    const supabase = createMockSupabase({
      tables: {
        post_comments: {
          data: {
            id: "00000000-0000-4000-8000-000000000801",
            moderation_status: "approved",
          },
          error: null,
        },
        moderation_audit_log: { data: null, error: null },
      },
    });

    const originalFrom = supabase.from.bind(supabase);
    supabase.from = ((table: string) => {
      const builder = originalFrom(table) as unknown as Record<string, unknown>;
      if (table === "post_comments") {
        builder.update = () => ({
          eq: () => ({
            select: () => ({
              single: async () => ({
                data: {
                  id: "00000000-0000-4000-8000-000000000801",
                  moderation_status: "approved",
                },
                error: null,
              }),
            }),
          }),
        });
      }
      if (table === "moderation_audit_log") {
        builder.insert = () => Promise.resolve({ data: null, error: null });
      }
      return builder;
    }) as unknown as typeof supabase.from;

    const result = await moderateSafetyQueueItem(supabase, {
      itemId: "00000000-0000-4000-8000-000000000801",
      kind: "comment",
      status: "approved",
      moderatorId: "00000000-0000-4000-8000-000000000401",
    });

    expect(result.moderation_status).toBe("approved");
  });

  it("updates content report status for post authors", async () => {
    const supabase = createMockSupabase({
      tables: {
        content_reports: {
          data: {
            id: "00000000-0000-4000-8000-000000000901",
            post_id: "00000000-0000-4000-8000-000000000601",
            status: "open",
            post: { author_id: "00000000-0000-4000-8000-000000000101" },
          },
          error: null,
        },
      },
    });

    const originalFrom = supabase.from.bind(supabase);
    supabase.from = ((table: string) => {
      const builder = originalFrom(table) as unknown as Record<string, unknown>;
      if (table === "content_reports") {
        builder.select = () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                id: "00000000-0000-4000-8000-000000000901",
                post_id: "00000000-0000-4000-8000-000000000601",
                status: "open",
                post: { author_id: "00000000-0000-4000-8000-000000000101" },
              },
              error: null,
            }),
          }),
        });
        builder.update = () => ({
          eq: () => ({
            select: () => ({
              single: async () => ({
                data: {
                  id: "00000000-0000-4000-8000-000000000901",
                  status: "reviewing",
                },
                error: null,
              }),
            }),
          }),
        });
      }
      return builder;
    }) as unknown as typeof supabase.from;

    const result = await updateContentReportStatus(supabase, {
      reportId: "00000000-0000-4000-8000-000000000901",
      status: "reviewing",
      moderatorId: "00000000-0000-4000-8000-000000000101",
      isPlatformAdmin: false,
    });

    expect(result.status).toBe("reviewing");
  });
});
