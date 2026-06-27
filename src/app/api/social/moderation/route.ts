import { isErrorResponse, jsonError, jsonSuccessWithMeta, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { moderateSafetyQueueItem,moderationActionSchema } from "@/features/social";
import { isCurrentUserPlatformAdmin } from "@/lib/domain/admin";
import { createClient } from "@/lib/supabase/server";

export const PATCH = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const isPlatformAdmin = await isCurrentUserPlatformAdmin(supabase);
  if (profileOrError.role !== "teacher" && !isPlatformAdmin) {
    return jsonError(
      "Only content owners or platform admins can moderate this queue.",
      403,
      "FORBIDDEN",
    );
  }

  const body = moderationActionSchema.parse(await request.json());
  const data = await moderateSafetyQueueItem(supabase, {
    itemId: body.itemId,
    kind: body.kind,
    moderatorId: profileOrError.id,
    status: body.status,
  });

  return jsonSuccessWithMeta(data, { action: "moderate-safety-item" });
}, { fallbackMessage: "Moderation action failed." });
