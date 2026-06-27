import { RateLimitExceededError } from "@/features/shared";
import { createStoryReply, storyReplySchema } from "@/features/social";
import { isErrorResponse, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const POST = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const rateLimit = checkRateLimit(`story-reply:${profileOrError.id}`, 10, 60_000);
  if (!rateLimit.allowed) {
    throw new RateLimitExceededError(
      `Too many replies. Try again in ${rateLimit.retryAfterSeconds} seconds.`,
      rateLimit.retryAfterSeconds,
    );
  }

  const body = storyReplySchema.parse(await request.json());
  const reply = await createStoryReply(supabase, {
    storyId: body.storyId,
    userId: profileOrError.id,
    userRole: profileOrError.role,
    content: body.content,
  });

  return jsonSuccess(reply, 201);
}, { fallbackMessage: "Reply could not be sent." });
