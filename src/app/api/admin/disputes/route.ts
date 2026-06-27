import { NextResponse } from "next/server";

import { isErrorResponse, requireAuthenticatedProfile } from "@/features/shared/api/require-auth";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { isCurrentUserPlatformAdmin, resolvePaymentDispute } from "@/lib/domain/admin";
import { createClient } from "@/lib/supabase/server";

export const POST = withApiHandler(async (request) => {
  const supabase = await createClient();
  const profile = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profile)) return profile;

  const isAdmin = await isCurrentUserPlatformAdmin(supabase);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const data = await resolvePaymentDispute(supabase, profile.id, body);
  return NextResponse.json({ data });
});
