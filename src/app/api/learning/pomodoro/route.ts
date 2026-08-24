import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { captureServerEvent } from "@/lib/server/analytics";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "student") {
      return NextResponse.json({ error: "Sadece öğrenciler Pomodoro puanı kazanabilir." }, { status: 403 });
    }

    const adminSupabase = createAdminClient();
    if (!adminSupabase) {
      return NextResponse.json({ error: "Service role missing" }, { status: 500 });
    }
    
    // Optional: Log activity in learning_events or student_activity_log if exists
    const { error: insertError } = await adminSupabase.from("learning_events").insert({
      user_id: profile.id,
      action_type: "pomodoro_completed",
      points_awarded: 50,
      target_id: crypto.randomUUID() // unique per session so daily repeats record
    });

    void captureServerEvent(profile.id, "pomodoro_completed", { minutes: 25 });
    
    if (insertError) {
      console.error("[Zigo API Error] Failed to log learning activity:", JSON.stringify(insertError));
    }
    
    // Get latest points to avoid stale data
    const { data: latestProfile } = await adminSupabase
      .from("users")
      .select("total_points")
      .eq("id", profile.id)
      .single();
      
    const currentPoints = latestProfile?.total_points || 0;
    const newPoints = currentPoints + 50;

    const { error: updateError } = await adminSupabase
      .from("users")
      .update({ total_points: newPoints })
      .eq("id", profile.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, awardedXP: 50, totalPoints: newPoints });
  } catch (error) {
    console.error("Pomodoro XP error:", error);
    return NextResponse.json({ error: "Puan eklenirken bir hata oluştu" }, { status: 500 });
  }
}
