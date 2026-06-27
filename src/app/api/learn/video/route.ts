import { completeVideoBodySchema, completeVideoPost } from "@/features/learning";
import { isErrorResponse, jsonError, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

export const POST = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, {
    excludeRoles: ["teacher"],
  });
  if (isErrorResponse(profileOrError)) return profileOrError;

  const body = completeVideoBodySchema.parse(await request.json());

  if (profileOrError.role === "parent" && !body.childProfileId) {
    return jsonError("Parent video completion requires a child profile.", 400, "VALIDATION_ERROR");
  }

  const completion = await completeVideoPost(supabase, {
    postId: body.postId,
    secondsWatched: body.secondsWatched,
    childProfileId: profileOrError.role === "parent" ? body.childProfileId : undefined,
  });

  return jsonSuccess(completion, 201);
}, { fallbackMessage: "Video reward could not be saved." });
