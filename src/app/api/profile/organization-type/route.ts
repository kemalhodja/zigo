import { setUserOrganizationType } from "@/features/profile/services";
import { setOrganizationTypeSchema } from "@/features/profile/types";
import { isErrorResponse, jsonSuccess, requireAuthUser } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

export const PATCH = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const userOrError = await requireAuthUser(supabase);
  if (isErrorResponse(userOrError)) return userOrError;

  const body = setOrganizationTypeSchema.parse(await request.json());
  await setUserOrganizationType(supabase, body.organizationType);
  return jsonSuccess({ organizationType: body.organizationType });
}, { fallbackMessage: "Organization type could not be saved." });
