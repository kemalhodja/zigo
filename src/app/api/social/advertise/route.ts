import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "student") {
      return NextResponse.json({ error: "Sadece öğrenciler profilini öne çıkarabilir." }, { status: 403 });
    }

    const adminSupabase = supabase;
    if (!adminSupabase) {
      return NextResponse.json({ error: "Service role missing" }, { status: 500 });
    }
    
    // Get latest points to avoid stale data
    const { data: latestProfile } = await adminSupabase
      .from("users")
      .select("total_points")
      .eq("id", profile.id)
      .single();
      
    const currentPoints = latestProfile?.total_points || 0;
    const ADVERTISE_COST = 500;

    if (currentPoints < ADVERTISE_COST) {
      return NextResponse.json({ error: "Yetersiz puan. Profilinizi öne çıkarmak için en az 500 XP gereklidir." }, { status: 400 });
    }

    const newPoints = currentPoints - ADVERTISE_COST;

    const { error: updateError } = await adminSupabase
      .from("users")
      .update({ total_points: newPoints })
      .eq("id", profile.id);

    if (updateError) {
      throw updateError;
    }

    // Optional: Log activity in learning_events or student_activity_log
    const { error: insertError } = await adminSupabase.from("learning_events").insert({
      user_id: profile.id,
      action_type: "profile_advertised",
      points_awarded: -ADVERTISE_COST,
      target_id: profile.id
    });
    
    if (insertError) {
      console.error("[Zigo API Error] Failed to log advertise activity:", JSON.stringify(insertError));
    }

    return NextResponse.json({ success: true, spentXP: ADVERTISE_COST, totalPoints: newPoints });
  } catch (error) {
    console.error("Profile advertise error:", error);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu" }, { status: 500 });
  }
}
