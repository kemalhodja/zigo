import { NextResponse } from "next/server";

import { getLessonRequestUnreadCount } from "@/features/lesson/services";
import { isErrorResponse, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async () => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  if (profileOrError.role === "student") {
    return NextResponse.json({ count: 0 });
  }

  const count = await getLessonRequestUnreadCount(supabase, profileOrError.id, profileOrError.role);
  return NextResponse.json({ count });
}, { fallbackMessage: "Unread count could not be loaded." });
