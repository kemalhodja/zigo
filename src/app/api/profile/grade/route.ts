import { updateUserGradeLevel } from "@/features/profile/services";
import { updateGradeLevelBodySchema } from "@/features/profile/types";
import { isErrorResponse, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

export const PATCH = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, {
    roles: ["student", "parent"],
  });
  if (isErrorResponse(profileOrError)) return profileOrError;

  const body = updateGradeLevelBodySchema.parse(await request.json());
  const updated = await updateUserGradeLevel(supabase, { gradeLevel: body.gradeLevel });
  return jsonSuccess(updated);
}, { fallbackMessage: "Grade level could not be updated." });
