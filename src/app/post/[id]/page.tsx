import { notFound } from "next/navigation";

import { toDisplayPost } from "@/app/_components/home/data";
import { VirtualFeedClient } from "@/app/_components/home/virtual-feed-client";
import { hasSupabaseEnv } from "@/lib/config";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getSocialFeed, getSocialPostById, isFollowing } from "@/lib/domain/social";
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
        <VirtualFeedClient
          messages={m}
          posts={[]}
          suggestedCreators={[]}
          teacherBadges={m.teacherBadges}
          viewerRole="guest"
        />
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

  const suggestedPostsPage = await getSocialFeed(supabase, profile?.id);
  const suggestedPosts = suggestedPostsPage.posts.filter((item) => item.id !== post.id).slice(0, 14);

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
      <VirtualFeedClient
        messages={m}
        posts={displayPosts}
        suggestedCreators={[]}
        teacherBadges={m.teacherBadges}
        viewerRole={profile?.role}
      />
    </div>
  );
}
