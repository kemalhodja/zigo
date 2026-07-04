import { describe, expect, it } from "vitest";

import { getPersonalizedFeed } from "@/lib/domain/feed/queries";
import { createMockSupabase } from "@/test/mock-supabase";

describe("getPersonalizedFeed", () => {
  it("returns empty feed when learner has no interests", async () => {
    const supabase = createMockSupabase({
      tables: {
        user_interests: { data: [], error: null },
      },
    });

    const posts = await getPersonalizedFeed(supabase, "00000000-0000-4000-8000-000000000301");
    expect(posts).toEqual([]);
  });

  it("filters posts by matched area ids", async () => {
    const supabase = createMockSupabase({
      tables: {
        user_interests: { data: [{ area_id: 2 }], error: null },
        social_posts: {
          data: [
            {
              id: "p1",
              title: "Kesirler",
              content: null,
              caption: "Kesirler",
              media_url: null,
              area_id: 2,
              post_type: "micro",
              quiz_id: null,
              created_at: "2026-01-01T00:00:00.000Z",
              author: { full_name: "Öğretmen", is_verified: true },
            },
          ],
          error: null,
        },
      },
    });

    const posts = await getPersonalizedFeed(supabase, "00000000-0000-4000-8000-000000000301");
    expect(posts).toHaveLength(1);
    expect(posts[0]?.area_id).toBe(2);
  });
});
