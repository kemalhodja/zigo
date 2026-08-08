import { NextResponse } from "next/server";

import { exportUserData } from "@/lib/domain/account-compliance";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const baseData = await exportUserData(supabase);

    // Extended KVKK export: lesson_requests and subscriptions personal data
    const [lessonRequestsResult, subscriptionsResult] = await Promise.allSettled([
      supabase
        .from("lesson_requests" as never)
        .select("id, created_at, status, message, teacher_id, student_id")
        .or(`student_id.eq.${profile.id},teacher_id.eq.${profile.id}`)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("user_subscriptions" as never)
        .select("id, created_at, status, plan_id, trial_ends_at, current_period_end")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const lesson_requests =
      lessonRequestsResult.status === "fulfilled" ? (lessonRequestsResult.value.data ?? []) : [];
    const subscriptions =
      subscriptionsResult.status === "fulfilled" ? (subscriptionsResult.value.data ?? []) : [];

    return NextResponse.json({
      data: {
        ...baseData,
        lesson_requests,
        subscriptions,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
