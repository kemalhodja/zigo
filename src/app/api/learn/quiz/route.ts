import {
  completeVideoBodySchema,
  completeVideoPost,
  getQuizQuestionsForPlay,
  submitQuizAttempt,
  submitQuizBodySchema,
} from "@/features/learning";
import { isErrorResponse, jsonError, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

export const POST = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, {
    excludeRoles: ["teacher"],
  });
  if (isErrorResponse(profileOrError)) return profileOrError;

  const body = submitQuizBodySchema.parse(await request.json());

  if (profileOrError.role === "parent" && !body.childProfileId) {
    return jsonError("Parent quiz attempts require a child profile.", 400, "VALIDATION_ERROR");
  }

  const attempt = await submitQuizAttempt(supabase, {
    quizId: body.quizId,
    selectedOption: body.selectedOption,
    answers: body.answers,
    childProfileId: profileOrError.role === "parent" ? body.childProfileId : undefined,
  });

  return jsonSuccess(attempt, 201);
}, { fallbackMessage: "Quiz attempt could not be saved." });
