import { weeklyProgressQuerySchema } from "@/features/matching/types";
import { getParentWeeklyProgressSummary } from "@/features/matching/services";
import { isErrorResponse, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, { roles: ["parent"] });
  if (isErrorResponse(profileOrError)) return profileOrError;

  const query = weeklyProgressQuerySchema.parse({
    childProfileId: new URL(request.url).searchParams.get("childProfileId") ?? undefined,
  });

  const data = await getParentWeeklyProgressSummary(
    supabase,
    profileOrError.id,
    query.childProfileId,
  );

  return jsonSuccess(data);
}, { fallbackMessage: "Weekly summary failed." });
