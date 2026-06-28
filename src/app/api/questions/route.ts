import {
  createQuestion,
  createQuestionBodySchema,
  getMatchedQuestions,
} from "@/features/questions";
import {
  assertAuthzDecision,
  canAskQuestion,
  jsonSuccess,
  withAuthorizedApiHandler,
} from "@/features/shared";
import { RateLimitExceededError } from "@/features/shared/errors/global-error-handler";
import { checkRateLimit } from "@/lib/server/rate-limit";

export const GET = withAuthorizedApiHandler(
  { enforceApiPrefixRule: false },
  async (_request, _context, { supabase, auth }) => {
    const questions = await getMatchedQuestions(supabase, auth.userId);
    return jsonSuccess(questions);
  },
  { fallbackMessage: "Questions could not be loaded." },
);

export const POST = withAuthorizedApiHandler(
  {
    excludeRoles: ["teacher"],
    capability: "question:create",
    enforceApiPrefixRule: false,
  },
  async (request, _context, { supabase, auth }) => {
    const rateLimit = checkRateLimit(`question:${auth.userId}`, 8, 60 * 60_000);
    if (!rateLimit.allowed) {
      throw new RateLimitExceededError(
        "Çok fazla soru gönderdin. Bir süre bekleyip tekrar dene.",
        rateLimit.retryAfterSeconds,
      );
    }

    const body = createQuestionBodySchema.parse(await request.json());
    const areaDecision = canAskQuestion(auth, body.areaId);
    const areaError = assertAuthzDecision(areaDecision);
    if (areaError) return areaError;

    const question = await createQuestion(supabase, {
      authorId: auth.userId,
      areaId: body.areaId,
      title: body.title,
      description: body.description,
    });

    return jsonSuccess(question, 201);
  },
  { fallbackMessage: "Question could not be created." },
);
