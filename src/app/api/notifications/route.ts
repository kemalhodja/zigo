import { getUserNotifications } from "@/features/notifications/services";
import { isErrorResponse, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unreadOnly") === "1";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  const notifications = await getUserNotifications(supabase, profileOrError.id, {
    unreadOnly,
    limit: Number.isFinite(limit) ? limit : undefined,
  });

  return jsonSuccess(notifications);
}, { fallbackMessage: "Notifications could not be loaded." });
