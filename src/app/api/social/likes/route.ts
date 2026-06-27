import { socialPostActionSchema, toggleLike } from "@/features/social";
import { isErrorResponse, jsonSuccessWithMeta, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

export const POST = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const body = socialPostActionSchema.parse(await request.json());
  const data = await toggleLike(supabase, {
    postId: body.postId,
    userId: profileOrError.id,
  });

  return jsonSuccessWithMeta(data, { action: "toggle-like" });
}, { fallbackMessage: "Like action failed." });
