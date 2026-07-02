import { z } from "zod";

import { completeRoleSelection } from "@/lib/domain/study-groups";
import { resolveRegistrationAccount } from "@/lib/domain/registration-account";
import { isErrorResponse, jsonSuccess, requireAuthUser } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  accountKind: z.enum(["student", "parent", "teacher", "institution", "platform"]),
  role: z.enum(["teacher", "parent", "student", "platform"]).optional(),
  organizationType: z
    .enum(["kurs", "okul", "egitim_kurumu", "egitim_platformu"])
    .nullish(),
});

export const POST = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const userOrError = await requireAuthUser(supabase);
  if (isErrorResponse(userOrError)) return userOrError;

  const body = bodySchema.parse(await request.json());
  const account = resolveRegistrationAccount(body.accountKind);

  const profile = await completeRoleSelection(supabase, {
    role: account.role,
    organizationType: account.organizationType ?? body.organizationType ?? null,
  });

  return jsonSuccess(profile);
}, { fallbackMessage: "Role could not be saved." });
