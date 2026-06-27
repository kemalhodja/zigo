import {
  createLessonRequest,
  getLessonRequestsForUser,
} from "@/features/lesson/services";
import { assertNotStudentRole } from "@/features/lesson/services/lesson-access.service";
import {
  createLessonRequestBodySchema,
} from "@/features/lesson/types";
import { isErrorResponse, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { RateLimitExceededError } from "@/features/shared/errors/global-error-handler";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async () => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const studentBlock = assertNotStudentRole(profileOrError.role);
  if (studentBlock) return studentBlock;

  const data = await getLessonRequestsForUser(supabase, profileOrError.id);
  return jsonSuccess(data);
}, { fallbackMessage: "Lesson requests could not be loaded." });

export const POST = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, { roles: ["parent"] });
  if (isErrorResponse(profileOrError)) return profileOrError;

  const rateLimit = checkRateLimit(`lesson-request:${profileOrError.id}`, 6, 60 * 60_000);
  if (!rateLimit.allowed) {
    throw new RateLimitExceededError(
      "Çok fazla ders talebi gönderdin. Bir süre bekleyip tekrar dene.",
      rateLimit.retryAfterSeconds,
    );
  }

  const body = createLessonRequestBodySchema.parse(await request.json());
  const created = await createLessonRequest(supabase, {
    senderId: profileOrError.id,
    receiverId: body.receiverId,
    childProfileId: body.childProfileId,
    areaId: body.areaId,
    messageBody: body.messageBody,
    priority: body.priority,
  });

  return jsonSuccess(created, 201);
}, { fallbackMessage: "Lesson request could not be created." });
