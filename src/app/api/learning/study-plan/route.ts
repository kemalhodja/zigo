import { getUserSubscription } from "@/lib/domain/subscription";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user has Zigo Plus subscription (multi-source resilient check)
  const subscription = await getUserSubscription(supabase, user.id);

  if (!subscription.isPremium) {
    return Response.json(
      { error: "Zigo Plus aboneliği gerektirir", upgradeRequired: true },
      { status: 402 }
    );
  }

  const body = await request.json();
  const areaId = body?.areaId ?? null;
  const weeklyPomodoroGoal = body?.weeklyPomodoroGoal ?? 5;
  const primaryTopic = body?.primaryTopic ?? "Weekly focus plan";

  const { data, error } = await supabase.rpc("upsert_study_plan", {
    p_area_id: areaId,
    p_weekly_pomodoro_goal: weeklyPomodoroGoal,
    p_primary_topic: primaryTopic,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json(data);
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await getUserSubscription(supabase, user.id);

  if (!subscription.isPremium) {
    return Response.json(
      { error: "Zigo Plus aboneliği gerektirir", upgradeRequired: true },
      { status: 402 }
    );
  }

  const { data, error } = await supabase
    .from("study_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (error && error.code !== "PGRST116") {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json(data ?? null);
}