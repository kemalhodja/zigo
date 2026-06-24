import type { SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

import { SOCIAL_FEED_CACHE_TAG, socialFeedCacheTag } from "@/lib/domain/social/cache";
import { getSocialFeed, type SocialFeedQuery } from "@/lib/domain/social/feed";
import type { Database } from "@/lib/supabase/database.types";

export async function getCachedSocialFeed(
  supabase: SupabaseClient<Database>,
  viewerId: string | undefined,
  query: SocialFeedQuery = {},
) {
  const cacheKey = viewerId ?? "guest";

  return unstable_cache(
    async () => getSocialFeed(supabase, viewerId, query),
    ["social-feed", cacheKey, JSON.stringify(query)],
    {
      tags: viewerId ? [SOCIAL_FEED_CACHE_TAG, socialFeedCacheTag(viewerId)] : [SOCIAL_FEED_CACHE_TAG],
      revalidate: 30,
    },
  )();
}
