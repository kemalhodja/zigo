import { getUnreadNotificationCount } from "@/features/notifications/services";
import { isErrorResponse, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async () => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const count = await getUnreadNotificationCount(supabase, profileOrError.id);
  return jsonSuccess({ count });
}, { fallbackMessage: "Unread notification count could not be loaded." });
