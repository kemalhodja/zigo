import { markNotificationRead } from "@/features/notifications/services";
import { isErrorResponse, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { jsonNotFound } from "@/features/shared/errors/global-error-handler";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withApiHandler(async (_request: Request, context: RouteContext) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const { id } = await context.params;

  try {
    const updated = await markNotificationRead(supabase, profileOrError.id, id);
    return jsonSuccess(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Notification not found.") {
      return jsonNotFound(error.message);
    }
    throw error;
  }
}, { fallbackMessage: "Notification could not be marked as read." });
