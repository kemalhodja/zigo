import { isErrorResponse, jsonError, jsonGone, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { openSponsoredAdUrl } from "@/features/social/services";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withApiHandler(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  try {
    const url = await openSponsoredAdUrl(supabase, id);
    return jsonSuccess({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sponsorlu reklam açılamadı.";
    const inactive =
      message.toLowerCase().includes("not active") ||
      message.toLowerCase().includes("expired");

    if (inactive) {
      return jsonGone("Bu sponsorlu reklam artık aktif değil.", "SPONSORED_INACTIVE");
    }

    return jsonError(message, 400, "BAD_REQUEST");
  }
}, { fallbackMessage: "Sponsorlu reklam açılamadı." });
