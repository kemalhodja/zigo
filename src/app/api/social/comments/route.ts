import { RateLimitExceededError } from "@/features/shared";
import { isErrorResponse, jsonSuccessWithMeta, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import {
  commentSchema,
  commentsQuerySchema,
  createComment,
  getPostComments,
} from "@/features/social";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const query = commentsQuerySchema.parse({
    postId: new URL(request.url).searchParams.get("postId"),
  });

  const comments = await getPostComments(supabase, query.postId);
  return jsonSuccessWithMeta(comments, { count: comments.length });
}, { fallbackMessage: "Comments could not be loaded." });

export const POST = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profileOrError)) return profileOrError;

  const rateLimit = checkRateLimit(`comment:${profileOrError.id}`, 10, 60_000);
  if (!rateLimit.allowed) {
    throw new RateLimitExceededError(
      `Too many comments. Try again in ${rateLimit.retryAfterSeconds} seconds.`,
      rateLimit.retryAfterSeconds,
    );
  }

  const body = commentSchema.parse(await request.json());
  const comment = await createComment(supabase, {
    postId: body.postId,
    userId: profileOrError.id,
    userRole: profileOrError.role,
    content: body.content,
  });

  return jsonSuccessWithMeta(comment, { action: "create-comment" }, 201);
}, { fallbackMessage: "Comment could not be posted." });
