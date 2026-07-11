import { describe, expect, it } from "vitest";

import { filterPostsForAudience, hydrateSocialPosts, type RawSocialPost } from "@/lib/domain/social/helpers";
import { createMockSupabase, samplePostRow } from "@/test/mock-supabase";

describe("filterPostsForAudience", () => {
  it("bypasses filtering for educational platforms and institutions", () => {
    const platformPost = {
      ...samplePostRow,
      id: "platform-post",
      target_audience: "parent_only" as const,
      author: {
        ...samplePostRow.author,
        organization_type: "egitim_platformu",
      },
    } as unknown as RawSocialPost;

    const institutionPost = {
      ...samplePostRow,
      id: "institution-post",
      target_audience: "grade" as const,
      target_grade: "1-4",
      author: {
        ...samplePostRow.author,
        organization_type: "okul",
      },
    } as unknown as RawSocialPost;

    const normalTeacherPost = {
      ...samplePostRow,
      id: "normal-teacher-post",
      target_audience: "parent_only" as const,
      author: {
        ...samplePostRow.author,
        organization_type: null,
      },
    } as unknown as RawSocialPost;

    const filtered = filterPostsForAudience(
      [platformPost, institutionPost, normalTeacherPost],
      undefined,
      { role: "student", grade_level: "9-12" },
    );

    expect(filtered.map((p) => p.id)).toEqual(["platform-post", "institution-post"]);
  });
});

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

