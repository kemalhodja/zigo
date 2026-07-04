import { NextResponse } from "next/server";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import { getChildQuizActivity } from "@/lib/domain/parent-dashboard";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ childProfileId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { childProfileId } = await context.params;
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "parent") {
      return NextResponse.json({ error: "Parent access is required." }, { status: 403 });
    }

    const activity = await getChildQuizActivity(supabase, childProfileId);
    return NextResponse.json({ data: activity });
  } catch (error) {
    return respondWithDomainError(error, "Quiz activity could not be loaded.");
  }
}
