import {
  createProfileBodySchema,
  parseRegistrationAccountKind,
  updateProfileBodySchema,
} from "@/features/profile/types";
import { createProfile, updateUserProfile } from "@/features/profile/services";
import { isErrorResponse, jsonSuccess, requireAuthUser } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

export const POST = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const userOrError = await requireAuthUser(supabase);
  if (isErrorResponse(userOrError)) return userOrError;

  const body = createProfileBodySchema.parse(await request.json());
  const profile = await createProfile(supabase, {
    fullName: body.fullName,
    role: body.role,
    accountKind: parseRegistrationAccountKind(body.accountKind),
  });

  return jsonSuccess(profile, 201);
}, { fallbackMessage: "Profile could not be created." });

export const PATCH = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const userOrError = await requireAuthUser(supabase);
  if (isErrorResponse(userOrError)) return userOrError;

  const body = updateProfileBodySchema.parse(await request.json());
  const profile = await updateUserProfile(supabase, {
    bio: body.bio,
    avatarUrl: body.avatarUrl,
  });

  return jsonSuccess(profile);
}, { fallbackMessage: "Profile could not be updated." });
