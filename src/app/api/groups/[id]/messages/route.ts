import { z } from "zod";

import { isErrorResponse, jsonSuccess, requireAuthUser } from "@/features/shared";
import { jsonError } from "@/features/shared/errors/global-error-handler";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { assertSafeStudentTextAsync } from "@/lib/domain/moderation";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { sendStudyGroupMessage } from "@/lib/domain/study-groups";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export const POST = withApiHandler(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  const supabase = await createClient();
  const userOrError = await requireAuthUser(supabase);
  if (isErrorResponse(userOrError)) return userOrError;

  const profile = await getCurrentProfile(supabase);
  if (!profile || (profile.role !== "student" && profile.role !== "parent")) {
    return jsonError("Only students and parents can message in study groups.", 403);
  }

  const { id: groupId } = await context.params;
  const body = bodySchema.parse(await request.json());
  await assertSafeStudentTextAsync(body.content);

  const message = await sendStudyGroupMessage(supabase, {
    groupId,
    content: body.content,
  });

  return jsonSuccess(message, 201);
}, { fallbackMessage: "Message could not be sent." });
