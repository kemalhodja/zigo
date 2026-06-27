import { z } from "zod";

import {
  canUseDevLessonPackageBypass,
  createLessonPackageCheckoutSession,
  findLessonPackagePlan,
  getParentLessonPackageAccess,
  handleLessonPackageCheckoutCompleted,
  hasLessonPackageStripeConfigured,
  type LessonPackagePlanId,
} from "@/lib/domain/lesson-packages";
import { isErrorResponse, jsonError, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const checkoutBodySchema = z.object({
  planId: z.enum(["basic", "pro", "premium"]),
});

export const GET = withApiHandler(async () => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, { roles: ["parent"] });
  if (isErrorResponse(profileOrError)) return profileOrError;

  const access = await getParentLessonPackageAccess(supabase, profileOrError.id);
  return jsonSuccess(access);
}, { fallbackMessage: "Lesson package status could not be loaded." });

export const POST = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, { roles: ["parent"] });
  if (isErrorResponse(profileOrError)) return profileOrError;

  const body = checkoutBodySchema.parse(await request.json());
  const plan = findLessonPackagePlan(body.planId);
  if (!plan) {
    return jsonError("Unknown plan.", 400);
  }

  if (canUseDevLessonPackageBypass() && !hasLessonPackageStripeConfigured(body.planId)) {
    const admin = createAdminClient();
    if (!admin) {
      return jsonError("Service role required for dev activation.", 503);
    }
    const activated = await handleLessonPackageCheckoutCompleted(admin, {
      userId: profileOrError.id,
      planId: body.planId,
    });
    return jsonSuccess({ mode: "dev", subscription: activated });
  }

  const session = await createLessonPackageCheckoutSession(
    profileOrError.id,
    profileOrError.email,
    body.planId,
  );

  return jsonSuccess({ mode: "stripe", url: session.url, sessionId: session.id });
}, { fallbackMessage: "Lesson package checkout could not be started." });
