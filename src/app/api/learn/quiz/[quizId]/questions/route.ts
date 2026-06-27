import { getQuizQuestionsForPlay } from "@/features/learning";
import { isErrorResponse, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ quizId: string }>;
};

export const GET = withApiHandler(async (_request: Request, context: RouteContext) => {
  const { quizId } = await context.params;
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, {
    excludeRoles: ["teacher"],
  });
  if (isErrorResponse(profileOrError)) return profileOrError;

  const questions = await getQuizQuestionsForPlay(supabase, quizId);
  return jsonSuccess(questions);
}, { fallbackMessage: "Quiz questions could not be loaded." });
