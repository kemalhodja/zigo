import { markAllNotificationsRead } from "@/features/notifications/services";
import { isErrorResponse, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

export const POST = withApiHandler(async () => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  await markAllNotificationsRead(supabase, profileOrError.id);
  return jsonSuccess({ ok: true });
}, { fallbackMessage: "Notifications could not be marked as read." });
