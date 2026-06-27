import {
  readStoredShortcutPreferences,
  resolveShortcutOptionsForProfile,
  updateUserShortcutPreferences,
} from "@/features/profile/services";
import { updateShortcutPreferencesBodySchema } from "@/features/profile/types";
import { isErrorResponse, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { getDefaultShortcutPreferences } from "@/lib/domain/shortcut-preferences";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async () => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const stored = readStoredShortcutPreferences(profileOrError);
  const { role, canCreateSocialPost } = resolveShortcutOptionsForProfile(profileOrError);

  return jsonSuccess({
    preferences: stored,
    defaults: getDefaultShortcutPreferences(role, { canCreateSocialPost }),
  });
}, { fallbackMessage: "Shortcut preferences could not be loaded." });

export const PATCH = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const body = updateShortcutPreferencesBodySchema.parse(await request.json());
  const updated = await updateUserShortcutPreferences(supabase, profileOrError, body);
  return jsonSuccess(updated);
}, { fallbackMessage: "Shortcut preferences could not be updated." });
