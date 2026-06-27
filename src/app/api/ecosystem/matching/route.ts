import { findBestTeachers, upsertStudentNeed } from "@/features/matching/services";
import {
  matchingQuerySchema,
  upsertStudentNeedBodySchema,
} from "@/features/matching/types";
import { isErrorResponse, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const params = matchingQuerySchema.parse({
    childProfileId: new URL(request.url).searchParams.get("childProfileId") ?? undefined,
    studentUserId: new URL(request.url).searchParams.get("studentUserId") ?? undefined,
    limit: new URL(request.url).searchParams.get("limit") ?? undefined,
  });

  const data = await findBestTeachers(supabase, {
    studentUserId: profileOrError.role === "student" ? profileOrError.id : params.studentUserId,
    childProfileId: params.childProfileId,
    limit: params.limit,
  });

  return jsonSuccess(data);
}, { fallbackMessage: "Matching failed." });

export const POST = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const body = upsertStudentNeedBodySchema.parse(await request.json());
  const need = await upsertStudentNeed(supabase, {
    studentUserId: profileOrError.role === "student" ? profileOrError.id : body.studentUserId,
    childProfileId: body.childProfileId,
    areaId: body.areaId,
    weaknessLevel: body.weaknessLevel,
  });

  return jsonSuccess(need, 201);
}, { fallbackMessage: "Student need could not be saved." });
