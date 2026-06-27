import { RateLimitExceededError, isErrorResponse, jsonError, jsonSuccess, jsonSuccessWithMeta, requireAuthenticatedProfile } from "@/features/shared";
import {
  contentReportSchema,
  contentReportStatusSchema,
  reportSocialPost,
  updateContentReportStatus,
} from "@/features/social";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { isCurrentUserPlatformAdmin } from "@/lib/domain/admin";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const POST = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const rateLimit = checkRateLimit(`report:${profileOrError.id}`, 5, 60 * 60_000);
  if (!rateLimit.allowed) {
    throw new RateLimitExceededError(
      "Çok fazla bildirim gönderdin. Bir süre bekleyip tekrar dene.",
      rateLimit.retryAfterSeconds,
    );
  }

  const body = contentReportSchema.parse(await request.json());
  const data = await reportSocialPost(supabase, {
    postId: body.postId,
    reporterId: profileOrError.id,
    reason: body.reason,
    details: body.details,
  });

  return jsonSuccess(data);
}, { fallbackMessage: "Report could not be submitted." });

export const PATCH = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const isPlatformAdmin = await isCurrentUserPlatformAdmin(supabase);
  if (profileOrError.role !== "teacher" && !isPlatformAdmin) {
    return jsonError(
      "Only verified teachers or platform admins can update report status.",
      403,
      "FORBIDDEN",
    );
  }

  const body = contentReportStatusSchema.parse(await request.json());
  const data = await updateContentReportStatus(supabase, {
    reportId: body.reportId,
    status: body.status,
    moderatorId: profileOrError.id,
    isPlatformAdmin,
  });

  return jsonSuccessWithMeta(data, { action: "update-content-report" });
}, { fallbackMessage: "Report status could not be updated." });
