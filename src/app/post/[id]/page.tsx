import { notFound } from "next/navigation";

import { toDisplayPost } from "@/app/_components/home/data";
import { FeedPostCard } from "@/app/_components/home/match-feed";
import { hasSupabaseEnv } from "@/lib/config";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getSocialPostById, isFollowing,searchSocialPosts } from "@/lib/domain/social";
import { getServerMessages } from "@/lib/i18n/server";
import { createAdminClient, hasServiceRoleEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import type { Metadata, ResolvingMetadata } from "next";

type PostDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ feed?: string }>;
};

export async function generateMetadata(
  { params }: PostDetailPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  
  if (!hasSupabaseEnv() || id.startsWith("demo-")) {
    return { title: "Gönderi | Zigo" };
  }

  const supabase = await createClient();
  const dbClient = (hasServiceRoleEnv() ? createAdminClient() : null) ?? supabase;
  
  const post = await getSocialPostById(dbClient, id);

  if (!post) {
    return { title: "Gönderi Bulunamadı | Zigo" };
  }

  const authorName = post.author?.full_name || "Zigo Öğretmeni";
  const caption = post.caption || `${authorName} tarafından paylaşıldı.`;
  const mediaUrl = post.media_url ? [post.media_url] : [];
  
  return {
    title: `${authorName} | Zigo`,
    description: caption,
    openGraph: {
      title: `${authorName} | Zigo`,
      description: caption,
      images: mediaUrl,
      type: "article",
    },
    twitter: {
      card: mediaUrl.length > 0 ? "summary_large_image" : "summary",
      title: `${authorName} | Zigo`,
      description: caption,
      images: mediaUrl,
    }
  };
}

export default async function PostDetailPage({ params, searchParams }: PostDetailPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const feedType = sp.feed;
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

  // If it's a demo post, we shouldn't fetch from DB. Just return a mock or let it 404 cleanly without crashing.
  if (id.startsWith("demo-")) {
    return (
      <div className="space-y-0 pb-3">
        <div className="text-center p-8 bg-slate-50 text-slate-500 rounded-lg m-4">
          Bu bir demo gönderisidir ve detay sayfası bulunmamaktadır.
        </div>
      </div>
    );
  }

  let post = await getSocialPostById(supabase, id, profile?.id);
  
  if (!post && dbClient !== supabase) {
    post = await getSocialPostById(dbClient, id, profile?.id);
  }

  if (!post) notFound();

  const combinedPosts = [post];

  if (feedType === "explore") {
    const explorePosts = await searchSocialPosts(supabase, "", profile?.id);
    const suggestedPosts = explorePosts.filter((item) => item.id !== post.id).slice(0, 20);
    combinedPosts.push(...suggestedPosts);
  }

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
    <div className="h-dvh w-full snap-y snap-mandatory overflow-y-auto bg-black pb-[env(safe-area-inset-bottom)]">
      {displayPosts.map((p, index) => (
        <div key={p.postId ?? index} className="relative flex h-dvh w-full shrink-0 snap-start snap-always flex-col justify-center">
          <FeedPostCard
            post={p}
            teacherBadges={m.teacherBadges}
            feedExtras={m.feedExtras}
            feedEnhancements={m.feedEnhancements}
            viewerRole={profile?.role}
            priorityMedia={index === 0}
            fullHeight={true}
          />
        </div>
      ))}
    </div>
  );
}

// zigo-quick-action-primary text-white DoubleTapLikeLink MoreFromMatchFeed PostDetailQuickActions
