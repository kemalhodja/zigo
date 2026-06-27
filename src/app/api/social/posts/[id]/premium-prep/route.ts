import { openPremiumPrepUrl } from "@/lib/domain/premium-prep";
import { isErrorResponse, jsonError, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withApiHandler(async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, {
    roles: ["student", "parent"],
  });
  if (isErrorResponse(profileOrError)) return profileOrError;

  try {
    const url = await openPremiumPrepUrl(supabase, id);
    return jsonSuccess({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kaynak açılamadı.";
    const needsSubscription =
      message.toLowerCase().includes("premium subscription") ||
      message.toLowerCase().includes("zigo plus");

    if (needsSubscription) {
      return jsonError(
        "Bu yazılı hazırlık kaynağı Zigo Plus aboneliği ile açılır.",
        402,
        "SUBSCRIPTION_REQUIRED",
      );
    }

    return jsonError(message, 400, "BAD_REQUEST");
  }
}, { fallbackMessage: "Kaynak açılamadı." });
