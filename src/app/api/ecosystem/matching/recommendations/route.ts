import {
  getSmartRecommendations,
  getTeachersForSubject,
} from "@/features/matching/services/recommendations.service";
import { recommendationsQuerySchema } from "@/features/matching/types/recommendations.schemas";
import { isErrorResponse, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, {
    roles: ["parent", "student"],
  });
  if (isErrorResponse(profileOrError)) return profileOrError;

  const url = new URL(request.url);
  const params = recommendationsQuerySchema.parse({
    childProfileId: url.searchParams.get("childProfileId") ?? undefined,
    studentUserId: url.searchParams.get("studentUserId") ?? undefined,
    subject: url.searchParams.get("subject") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    autoAnalyze: url.searchParams.get("autoAnalyze") ?? undefined,
  });

  if (params.subject) {
    const teachers = await getTeachersForSubject(supabase, params.subject, params.limit);
    return jsonSuccess({
      sessionsAnalyzed: 0,
      weaknesses: [],
      teachers,
    });
  }

  const studentUserId =
    profileOrError.role === "student" ? profileOrError.id : params.studentUserId;
  const childProfileId = profileOrError.role === "parent" ? params.childProfileId : undefined;

  if (profileOrError.role === "parent" && !childProfileId) {
    return jsonSuccess({
      sessionsAnalyzed: 0,
      weaknesses: [],
      teachers: [],
    });
  }

  const data = await getSmartRecommendations(supabase, {
    studentUserId,
    childProfileId,
    limit: params.limit,
    autoAnalyze: params.autoAnalyze,
  });

  return jsonSuccess(data);
}, { fallbackMessage: "Recommendations could not be loaded." });
