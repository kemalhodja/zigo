import { NextResponse } from "next/server";

import { upsertStudyPlan, upsertStudyPlanSchema } from "@/lib/domain/focus-analytics";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getUserSubscription } from "@/lib/domain/subscription";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "student") {
      return NextResponse.json({ error: "Only students can save study plans." }, { status: 403 });
    }

    const subscription = await getUserSubscription(supabase, profile.id);
    if (!subscription.isPremium) {
      return NextResponse.json(
        { error: "Custom study plans are part of Zigo Plus. Upgrade to set weekly Pomodoro goals." },
        { status: 402 },
      );
    }

    const body = upsertStudyPlanSchema.parse(await request.json());
    const data = await upsertStudyPlan(supabase, body);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Study plan could not be saved.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
