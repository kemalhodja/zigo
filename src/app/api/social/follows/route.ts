import { followSchema, toggleFollow } from "@/features/social";
import { isErrorResponse, jsonSuccessWithMeta, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

export const POST = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const body = followSchema.parse(await request.json());
  const data = await toggleFollow(supabase, {
    followerId: profileOrError.id,
    followingId: body.followingId,
  });

  return jsonSuccessWithMeta(data, { action: "toggle-follow" });
}, { fallbackMessage: "Follow action failed." });
