import { z } from "zod";

import { isErrorResponse, jsonSuccess, requireAuthUser } from "@/features/shared";
import { jsonError } from "@/features/shared/errors/global-error-handler";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { reviewStudyGroupApproval } from "@/lib/domain/study-groups";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  decision: z.enum(["approved", "rejected"]),
});

export const PATCH = withApiHandler(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  const supabase = await createClient();
  const userOrError = await requireAuthUser(supabase);
  if (isErrorResponse(userOrError)) return userOrError;

  const profile = await getCurrentProfile(supabase);
  if (!profile || profile.role !== "parent") {
    return jsonError("Only parents can review study group approvals.", 403);
  }

  const { id: approvalId } = await context.params;
  const body = bodySchema.parse(await request.json());
  const approval = await reviewStudyGroupApproval(supabase, {
    approvalId,
    decision: body.decision,
  });

  return jsonSuccess(approval);
}, { fallbackMessage: "Approval could not be saved." });
