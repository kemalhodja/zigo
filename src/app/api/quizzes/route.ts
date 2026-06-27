import {
  createQuizBodySchema,
  createTeacherQuiz,
} from "@/features/learning";
import { isErrorResponse, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { getUserSubscription } from "@/lib/domain/subscription";
import { assertTeacherCreatorPlus } from "@/lib/domain/teacher-creator-plus";
import { createClient } from "@/lib/supabase/server";

export const POST = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, {
    roles: ["teacher"],
    requireVerified: true,
  });
  if (isErrorResponse(profileOrError)) return profileOrError;

  const subscription = await getUserSubscription(supabase, profileOrError.id);
  assertTeacherCreatorPlus(subscription, profileOrError.role, "mini quiz oluşturma");

  const body = createQuizBodySchema.parse(await request.json());
  const quiz = await createTeacherQuiz(supabase, {
    teacherId: profileOrError.id,
    areaId: body.areaId,
    title: body.title,
    questionText: body.questionText,
    options: body.options,
    correctOption: body.correctOption,
    pointsReward: body.pointsReward,
  });

  return jsonSuccess(quiz, 201);
}, { fallbackMessage: "Quiz could not be created." });
