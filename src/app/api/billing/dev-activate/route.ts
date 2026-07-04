import { NextResponse } from "next/server";

import { activateZigoPlus, canUseDevBillingBypass } from "@/lib/domain/billing";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    if (!canUseDevBillingBypass()) {
      return NextResponse.json({ error: "Dev billing bypass is disabled." }, { status: 403 });
    }

    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await activateZigoPlus(supabase, profile.id, {
      currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    });

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dev activation failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
