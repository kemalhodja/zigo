import { NextResponse } from "next/server";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/metrics/focus-week
 * North-star metric: last-7-day focused minutes for the signed-in student.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("get_weekly_focus_minutes");
    if (error) {
      return NextResponse.json({ error: "Odak özeti alınamadı." }, { status: 500 });
    }

    const [{ data: plan }, days] = await Promise.all([
      supabase
        .from("study_plans")
        .select("weekly_pomodoro_goal")
        .eq("user_id", profile.id)
        .maybeSingle(),
      Promise.resolve(data ?? []),
    ]);
    const totalMinutes = days.reduce((sum, row) => sum + Number(row.focus_minutes ?? 0), 0);

    return NextResponse.json({
      data: {
        days,
        totalMinutes,
        weeklyGoalMinutes:
          typeof plan?.weekly_pomodoro_goal === "number" ? plan.weekly_pomodoro_goal : null,
      },
    });
  } catch (error) {
    return respondWithDomainError(error, "Odak özeti alınamadı.");
  }
}
