import { z } from "zod";

import { isErrorResponse, jsonSuccess, requireAuthUser } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { jsonError } from "@/features/shared/errors/global-error-handler";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createStudyGroup } from "@/lib/domain/study-groups";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
  areaId: z.number().int().positive().optional(),
  parentEmail: z.string().email().optional(),
});

export const POST = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const userOrError = await requireAuthUser(supabase);
  if (isErrorResponse(userOrError)) return userOrError;

  const profile = await getCurrentProfile(supabase);
  if (!profile || (profile.role !== "student" && profile.role !== "parent")) {
    return jsonError("Only students and parents can create study groups.", 403);
  }

  const body = bodySchema.parse(await request.json());
  const group = await createStudyGroup(supabase, body);

  return jsonSuccess(group, 201);
}, { fallbackMessage: "Study group could not be created." });
