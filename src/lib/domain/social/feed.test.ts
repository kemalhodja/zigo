import { describe, expect, it } from "vitest";

import { getSocialFeed } from "@/lib/domain/social/feed";
import { createMockSupabase, samplePostRow } from "@/test/mock-supabase";

describe("social feed", () => {
  it("returns empty feed when viewer has no matched interests", async () => {
    const supabase = createMockSupabase({
      tables: {
        user_interests: { data: [], error: null },
      },
    });

    const page = await getSocialFeed(supabase, "00000000-0000-4000-8000-000000000301");
    expect(page.posts).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });

  it("filters posts by viewer area interests", async () => {
    const supabase = createMockSupabase({
      tables: {
        user_interests: { data: [{ area_id: 1 }, { area_id: 2 }], error: null },
        social_posts: { data: [samplePostRow], error: null },
        post_likes: {
          data: [{ post_id: samplePostRow.id }, { post_id: samplePostRow.id }],
          error: null,
        },
        post_comments: { data: [{ post_id: samplePostRow.id }], error: null },
        saved_posts: { data: [], error: null },
      },
    });

    const page = await getSocialFeed(supabase, "00000000-0000-4000-8000-000000000301");
    expect(page.posts).toHaveLength(1);
    expect(page.posts[0]?.area?.area_name).toBe("Matematik");
    expect(page.posts[0]?.likes_count).toBe(2);
    expect(page.posts[0]?.ranking_score).toBeGreaterThan(0);
  });

  it("supports postTypes filter without throwing", async () => {
    const supabase = createMockSupabase({
      tables: {
        user_interests: { data: [{ area_id: 1 }], error: null },
        social_posts: { data: [], error: null },
      },
    });

    const page = await getSocialFeed(supabase, "00000000-0000-4000-8000-000000000301", {
      postTypes: ["micro"],
    });
    expect(page.posts).toEqual([]);
  });

  it("loads unscoped feed when no viewer id is provided", async () => {
    const supabase = createMockSupabase({
      tables: {
        social_posts: { data: [samplePostRow], error: null },
        post_likes: { data: [], error: null },
        post_comments: { data: [], error: null },
        saved_posts: { data: [], error: null },
      },
    });

    const page = await getSocialFeed(supabase);
    expect(page.posts).toHaveLength(1);
  });

  it("respects legacy pagination offset in range query", async () => {
    const supabase = createMockSupabase({
      tables: {
        user_interests: { data: [{ area_id: 1 }], error: null },
        social_posts: { data: [], error: null },
      },
    });

    await getSocialFeed(supabase, "00000000-0000-4000-8000-000000000301", { limit: 10, offset: 20 });
    expect(supabase.from).toHaveBeenCalledWith("social_posts");
  });
});
