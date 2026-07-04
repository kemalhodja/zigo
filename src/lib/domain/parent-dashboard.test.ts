import { describe, expect, it } from "vitest";

import { getChildActivity, getChildQuizActivity } from "@/lib/domain/parent-dashboard";
import { createMockSupabase } from "@/test/mock-supabase";

describe("parent dashboard RPC", () => {
  it("maps child quiz activity RPC rows", async () => {
    const supabase = createMockSupabase({
      rpc: {
        get_parent_child_quiz_activity: {
          data: [
            {
              attempt_id: "a1",
              quiz_id: "q1",
              quiz_title: "Kesirler mini quiz",
              total_questions: 3,
              correct_answers: 2,
              score_percent: 67,
              points_awarded: 10,
              completed_at: "2026-01-01T00:00:00.000Z",
            },
          ],
          error: null,
        },
      },
    });

    const rows = await getChildQuizActivity(supabase, "00000000-0000-4000-8000-000000000401");
    expect(rows[0]?.quiz_title).toBe("Kesirler mini quiz");
    expect(rows[0]?.score_percent).toBe(67);
  });

  it("maps unified child activity timeline RPC rows", async () => {
    const supabase = createMockSupabase({
      rpc: {
        get_parent_child_activity: {
          data: [
            {
              activity_id: "act1",
              activity_type: "quiz_complete",
              title: "Quiz tamamlandı",
              points_awarded: 10,
              metadata: { quiz_id: "q1" },
              created_at: "2026-01-01T00:00:00.000Z",
            },
            {
              activity_id: "act2",
              activity_type: "micro_video_watched",
              title: "Micro izlendi",
              points_awarded: 10,
              metadata: {},
              created_at: "2026-01-02T00:00:00.000Z",
            },
          ],
          error: null,
        },
      },
    });

    const rows = await getChildActivity(supabase, "00000000-0000-4000-8000-000000000401");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.activity_type).toBe("quiz_complete");
    expect(rows[1]?.activity_type).toBe("micro_video_watched");
  });

  it("passes child profile id and limit to RPC", async () => {
    const supabase = createMockSupabase({
      rpc: {
        get_parent_child_activity: { data: [], error: null },
      },
    });

    await getChildActivity(supabase, "00000000-0000-4000-8000-000000000401", 5);
    expect(supabase.rpc).toHaveBeenCalledWith("get_parent_child_activity", {
      target_child_profile_id: "00000000-0000-4000-8000-000000000401",
      result_limit: 5,
    });
  });
});
