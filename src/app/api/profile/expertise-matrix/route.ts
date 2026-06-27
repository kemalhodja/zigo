import { NextResponse } from "next/server";

import { isErrorResponse, requireAuthenticatedProfile } from "@/features/shared/api/require-auth";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { setTeacherExpertiseMatrix } from "@/lib/domain/platform-activity";
import { createClient } from "@/lib/supabase/server";

export const POST = withApiHandler(async (request) => {
  const supabase = await createClient();
  const profile = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profile)) return profile;

  if (profile.role !== "teacher") {
    return NextResponse.json({ error: "Only teachers can update expertise matrix." }, { status: 403 });
  }

  const body = await request.json();
  const data = await setTeacherExpertiseMatrix(supabase, body.trackSlugs ?? []);
  return NextResponse.json({ data });
});
