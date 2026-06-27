import { isErrorResponse, jsonSuccess, requireAuthenticatedProfile } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import {
  createStory,
  createStorySchema,
  getActiveStories,
} from "@/features/social";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async () => {
  const supabase = await createClient();
  const stories = await getActiveStories(supabase);
  return jsonSuccess(stories);
}, { fallbackMessage: "Stories could not be loaded." });

export const POST = withApiHandler(async (request: Request) => {
  const supabase = await createClient();
  const profileOrError = await requireAuthenticatedProfile(supabase, {
    roles: ["teacher"],
    requireVerified: true,
  });
  if (isErrorResponse(profileOrError)) return profileOrError;

  const body = createStorySchema.parse(await request.json());
  const story = await createStory(supabase, {
    areaId: body.areaId,
    authorId: profileOrError.id,
    caption: body.caption,
    mediaUrl: body.mediaUrl,
  });

  return jsonSuccess(story, 201);
}, { fallbackMessage: "Story could not be created." });
