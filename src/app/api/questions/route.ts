import { RateLimitExceededError } from "@/features/shared/errors/global-error-handler";
import { isErrorResponse, jsonError, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { getUserInterestAreaIds } from "@/features/profile/services";
import {
  createQuestion,
  createQuestionBodySchema,
  getMatchedQuestions,
} from "@/features/questions";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async () => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const questions = await getMatchedQuestions(supabase, profileOrError.id);
  return jsonSuccess(questions);
}, { fallbackMessage: "Questions could not be loaded." });

export const POST = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, {
    excludeRoles: ["teacher"],
  });
  if (isErrorResponse(profileOrError)) return profileOrError;

  const rateLimit = checkRateLimit(`question:${profileOrError.id}`, 8, 60 * 60_000);
  if (!rateLimit.allowed) {
    throw new RateLimitExceededError(
      "Çok fazla soru gönderdin. Bir süre bekleyip tekrar dene.",
      rateLimit.retryAfterSeconds,
    );
  }

  const body = createQuestionBodySchema.parse(await request.json());
  const areaIds = await getUserInterestAreaIds(supabase, profileOrError.id);

  if (!areaIds.includes(body.areaId)) {
    return jsonError("Questions can only be asked in your selected education areas.", 403, "FORBIDDEN");
  }

  const question = await createQuestion(supabase, {
    authorId: profileOrError.id,
    areaId: body.areaId,
    title: body.title,
    description: body.description,
  });

  return jsonSuccess(question, 201);
}, { fallbackMessage: "Question could not be created." });
