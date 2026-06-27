import { NextResponse } from "next/server";

import { isErrorResponse, requireAuthenticatedProfile } from "@/features/shared/api/require-auth";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { getOnboardingIntake, saveOnboardingIntake } from "@/lib/domain/onboarding-intake";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async () => {
  const supabase = await createClient();
  const profile = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profile)) return profile;
  const data = await getOnboardingIntake(supabase, profile.id);
  return NextResponse.json({ data });
});

export const POST = withApiHandler(async (request) => {
  const supabase = await createClient();
  const profile = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profile)) return profile;
  const body = await request.json();
  const data = await saveOnboardingIntake(supabase, profile.id, body);
  return NextResponse.json({ data }, { status: 201 });
});
