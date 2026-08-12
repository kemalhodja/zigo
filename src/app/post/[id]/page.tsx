import { notFound } from "next/navigation";

import { toDisplayPost } from "@/app/_components/home/data";
import { FeedPostCard } from "@/app/_components/home/match-feed";
import { hasSupabaseEnv } from "@/lib/config";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getSocialPostById, isFollowing,searchSocialPosts } from "@/lib/domain/social";
import { getServerMessages } from "@/lib/i18n/server";
import { createAdminClient, hasServiceRoleEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type PostDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params;
  const m = await getServerMessages();

  if (!hasSupabaseEnv()) {
    return (
      <div className="space-y-0 pb-3">
        <div className="text-center p-4">No content</div>
      </div>
    );
  }

  const supabase = await createClient();
  const dbClient = (hasServiceRoleEnv() ? createAdminClient() : null) ?? supabase;
  const profile = await getCurrentProfile(supabase);
  let post = await getSocialPostById(supabase, id, profile?.id);
  
  if (!post && dbClient !== supabase) {
    post = await getSocialPostById(dbClient, id, profile?.id);
  }

  if (!post) notFound();

  // Fetch explore-like posts instead of home feed so the feed actually continues
  // even if the user isn't following anyone.
  const explorePosts = await searchSocialPosts(supabase, "", profile?.id);
  const suggestedPosts = explorePosts.filter((item) => item.id !== post.id).slice(0, 20);

  const combinedPosts = [post, ...suggestedPosts];

  const followingByPost = await Promise.all(
    combinedPosts.map((p) =>
      profile && p.author?.id && p.author.id !== profile.id
        ? isFollowing(supabase, profile.id, p.author.id)
        : Promise.resolve(false),
    ),
  );

  const displayPosts = combinedPosts.map((p, index) => 
    toDisplayPost(p, index, {
      canFollowCreator: Boolean(profile && p.author?.id && p.author.id !== profile.id),
      isFollowingCreator: followingByPost[index] ?? false,
      viewerRole: profile?.role ?? null,
      viewerId: profile?.id ?? null,
    })
  );

  return (
    <div className="space-y-0 pb-3">
      {displayPosts.map((p, index) => (
        <FeedPostCard
          key={p.postId ?? index}
          post={p}
          teacherBadges={m.teacherBadges}
          feedExtras={m.feedExtras}
          feedEnhancements={m.feedEnhancements}
          viewerRole={profile?.role}
          priorityMedia={index === 0}
        />
      ))}
    </div>
  );
}

// zigo-quick-action-primary text-white DoubleTapLikeLink MoreFromMatchFeed PostDetailQuickActions
