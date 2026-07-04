export const SOCIAL_FEED_CACHE_TAG = "social-feed";

export function socialFeedCacheTag(userId: string) {
  return `${SOCIAL_FEED_CACHE_TAG}:${userId}`;
}
