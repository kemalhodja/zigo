import { getVerifiedTeachersForParentLessonRequest } from "@/features/lesson/services";
import { isErrorResponse, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async () => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, { roles: ["parent"] });
  if (isErrorResponse(profileOrError)) return profileOrError;

  const data = await getVerifiedTeachersForParentLessonRequest(supabase, profileOrError.id);
  return jsonSuccess(data);
}, { fallbackMessage: "Teachers could not be loaded." });
