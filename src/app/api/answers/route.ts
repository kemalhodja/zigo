import { getUserInterestAreaIds } from "@/features/profile/services";
import {
  createAnswerBodySchema,
  createTeacherAnswer,
} from "@/features/questions";
import { isErrorResponse, jsonError, jsonNotFound, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

export const POST = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, {
    roles: ["teacher"],
    requireVerified: true,
  });
  if (isErrorResponse(profileOrError)) return profileOrError;

  const body = createAnswerBodySchema.parse(await request.json());
  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select("area_id")
    .eq("id", body.questionId)
    .maybeSingle();

  if (questionError) throw questionError;
  if (!question) return jsonNotFound("Question was not found.");

  const areaIds = await getUserInterestAreaIds(supabase, profileOrError.id);
  if (!areaIds.includes(question.area_id ?? 0)) {
    return jsonError("Teachers can answer only in assigned education areas.", 403, "FORBIDDEN");
  }

  const answer = await createTeacherAnswer(supabase, {
    teacherId: profileOrError.id,
    questionId: body.questionId,
    content: body.content,
  });

  return jsonSuccess(answer, 201);
}, { fallbackMessage: "Answer could not be created." });
