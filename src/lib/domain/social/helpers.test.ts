import { describe, expect, it } from "vitest";

import { hydrateSocialPosts } from "@/lib/domain/social/helpers";
import { createMockSupabase, samplePostRow } from "@/test/mock-supabase";

describe("hydrateSocialPosts", () => {
  it("batch-loads interaction counts for multiple posts", async () => {
    const secondPost = {
      ...samplePostRow,
      id: "00000000-0000-4000-8000-000000000602",
    } as typeof samplePostRow;

    const supabase = createMockSupabase({
      tables: {
        post_likes: {
          data: [{ post_id: samplePostRow.id }, { post_id: samplePostRow.id }],
          error: null,
        },
        post_comments: {
          data: [{ post_id: secondPost.id }],
          error: null,
        },
        saved_posts: { data: [], error: null },
      },
    });

    const hydrated = await hydrateSocialPosts(supabase, [samplePostRow, secondPost]);
    expect(hydrated[0]?.likes_count).toBe(2);
    expect(hydrated[0]?.comments_count).toBe(0);
    expect(hydrated[1]?.comments_count).toBe(1);
    expect(supabase.from).toHaveBeenCalledTimes(3);
  });
});
