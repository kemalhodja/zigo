import { z } from "zod";

import { isErrorResponse, jsonSuccess, requireAuthUser } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { jsonError } from "@/features/shared/errors/global-error-handler";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { requestStudyGroupJoin } from "@/lib/domain/study-groups";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  parentEmail: z.string().email(),
});

export const POST = withApiHandler(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  const supabase = await createClient();
  const userOrError = await requireAuthUser(supabase);
  if (isErrorResponse(userOrError)) return userOrError;

  const profile = await getCurrentProfile(supabase);
  if (!profile || profile.role !== "student") {
    return jsonError("Only students can request to join study groups.", 403);
  }

  const { id: groupId } = await context.params;
  const body = bodySchema.parse(await request.json());
  const approval = await requestStudyGroupJoin(supabase, {
    groupId,
    parentEmail: body.parentEmail,
  });

  return jsonSuccess(approval, 201);
}, { fallbackMessage: "Join request could not be created." });
