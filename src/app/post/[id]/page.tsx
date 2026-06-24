import Link from "next/link";
import { notFound } from "next/navigation";

import { DoubleTapLikeLink } from "@/components/double-tap-like-link";
import { PremiumPrepLink } from "@/components/premium-prep-link";
import { SocialMediaFrame } from "@/components/social-media-frame";
import { SocialPostActions } from "@/components/social-post-actions";
import { SocialAvatar } from "@/components/social-primitives";
import { SponsoredAdLink } from "@/components/sponsored-ad-link";
import { TeacherTrustBadges } from "@/components/teacher-trust-badges";
import { hasSupabaseEnv } from "@/lib/config";
import { canUseDevBillingBypass } from "@/lib/domain/billing";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getPostComments, getSocialFeed, getSocialPostById, type SocialFeedPost } from "@/lib/domain/social";
import { getServerMessages } from "@/lib/i18n/server";
import type { Messages } from "@/lib/i18n/types";
import { createClient } from "@/lib/supabase/server";

type PostDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params;

  if (!hasSupabaseEnv()) {
    return <PreviewPostDetail messages={await getServerMessages()} />;
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  const post = await getSocialPostById(supabase, id, profile?.id);

  if (!post) notFound();

  const [comments, suggestedPosts] = await Promise.all([
    profile ? getPostComments(supabase, post.id) : Promise.resolve([]),
    getMoreFromMatchFeed(supabase, post.id, profile?.id),
  ]);
  const m = await getServerMessages();
  const creator = post.author?.full_name ?? m.actions.zigoCreator;
  const postArea = post.area?.area_name;
  const showPremiumPrep =
    post.has_premium_prep &&
    Boolean(post.premium_prep_label) &&
    (profile?.role === "student" || profile?.role === "parent");
  const showSponsored = post.has_sponsored && Boolean(post.sponsored_label);
  const allowDevActivate = canUseDevBillingBypass();

  return (
    <div className="space-y-0 pb-3">
      <article className="-mx-4 overflow-hidden border-b border-slate-100 bg-white">
        <Link
          className="tap-scale flex items-center gap-3 px-4 py-2.5"
          href={post.author?.id ? `/profile/${post.author.id}` : "/profile"}
        >
          <SocialAvatar className="size-9" label={creator} />
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-night">{creator}</p>
            {post.author?.is_verified ? (
              <div className="mt-1">
                <TeacherTrustBadges
                  branches={postArea ? [postArea] : []}
                  moreLabel={m.teacherBadges.moreAreas}
                  verified
                  verifiedLabel={m.teacherBadges.verifiedTeacher}
                />
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-500">
                @{creator.toLowerCase().replaceAll(" ", "")}
              </p>
            )}
          </div>
        </Link>

        <DoubleTapLikeLink href={`/post/${post.id}`} initialLiked={post.is_liked} postId={post.id}>
          <SocialMediaFrame className="zigo-media border-y border-slate-50" mediaType={post.media_type} mediaUrl={post.media_url}>
            <div className="flex justify-end">
              {post.media_type === "video" ? (
                <span className="flex size-8 items-center justify-center rounded-lg bg-black/25 backdrop-blur">
                  <svg aria-hidden="true" className="ml-0.5 size-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              ) : null}
            </div>
            <div />
          </SocialMediaFrame>
        </DoubleTapLikeLink>

        <div className="space-y-2 px-4 pb-3 pt-2.5">
          <SocialPostActions
            initialComments={post.comments_count}
            initialLiked={post.is_liked}
            initialLikes={post.likes_count}
            initialSaved={post.is_saved}
            postId={post.id}
          />
          <p className="text-sm leading-5 text-slate-800">
            <span className="font-black text-night">{creator}</span> {post.caption}
          </p>
          {showPremiumPrep && post.premium_prep_label ? (
            <PremiumPrepLink
              allowDevActivate={allowDevActivate}
              canOpen={post.can_open_premium_prep}
              label={post.premium_prep_label}
              postId={post.id}
            />
          ) : null}
          {showSponsored && post.sponsored_label ? (
            <SponsoredAdLink
              canOpen={post.can_open_sponsored}
              disclosure={post.sponsored_disclosure}
              isActive={post.is_sponsored_active}
              label={post.sponsored_label}
              postId={post.id}
            />
          ) : null}
          <p className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-400">
            {m.postDetail.today} <span className="sr-only">Match-Feed</span>
          </p>
        </div>
      </article>

      <PostDetailQuickActions messages={m} postId={post.id} />

      <section className="-mx-4 bg-white px-4 py-4" id="comments">
        <h2 className="mb-3 text-sm font-black text-night">{m.postDetail.comments}</h2>
        <p className="mb-3 text-xs font-bold text-slate-500">{m.postDetail.studentCommentsReview}</p>
        {!profile ? (
          <div className="rounded-lg bg-slate-50 px-4 py-4">
            <p className="text-sm font-bold text-slate-600">
              {m.postDetail.signInComments} <span className="sr-only">safe comments</span>
            </p>
            <Link className="mt-3 inline-flex zigo-cta tap-scale rounded-lg px-4 py-2 text-xs font-black text-white" href={`/auth?next=/post/${post.id}`}>
              {m.auth.signIn}
            </Link>
          </div>
        ) : comments.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-4 py-4 text-sm font-bold text-slate-500">
            {m.postDetail.noComments} <span className="sr-only">safe reply</span>
          </p>
        ) : (
          comments.map((comment) => (
            <article className="border-b border-slate-100 py-3 last:border-b-0" key={comment.id}>
              <div className="flex items-center gap-2">
                <SocialAvatar className="size-8" label={comment.author?.full_name ?? m.postDetail.zigoUser} ring={false} />
                <p className="text-sm leading-5 text-slate-700">
                  <span className="font-black text-night">{comment.author?.full_name ?? m.postDetail.zigoUser}</span>{" "}
                  {comment.content}
                </p>
              </div>
            </article>
          ))
        )}
      </section>

      <MoreFromMatchFeed messages={m} posts={suggestedPosts} />
    </div>
  );
}

async function getMoreFromMatchFeed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  currentPostId: string,
  viewerId?: string,
) {
  const page = await getSocialFeed(supabase, viewerId);
  return page.posts.filter((item) => item.id !== currentPostId).slice(0, 6);
}

function PostDetailQuickActions({ messages: m, postId }: { messages: Messages; postId: string }) {
  return (
    <section className="-mx-4 bg-white px-4 py-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{m.postDetail.keepLearning}</p>
      <div className="zigo-action-grid mt-3 text-center font-black">
        <Link className="zigo-action-chip zigo-quick-action-primary tap-scale rounded-xl text-white" href="/micro">
          {m.nav.micro}
        </Link>
        <Link className="zigo-action-chip zigo-quick-action-secondary tap-scale rounded-xl text-violet-700" href="/learn">
          {m.dock.learn}
        </Link>
        <Link className="zigo-action-chip zigo-quick-action-secondary tap-scale rounded-xl text-violet-700" href={`/post/${postId}#comments`}>
          {m.postDetail.replies}
        </Link>
      </div>
    </section>
  );
}

function MoreFromMatchFeed({ messages: m, posts }: { messages: Messages; posts: SocialFeedPost[] }) {
  if (posts.length === 0) {
    return (
      <section className="-mx-4 border-t border-slate-100 bg-white px-6 py-12 text-center">
        <p className="text-sm font-black text-night">{m.postDetail.morePostsDesc}</p>
        <p className="mx-auto mt-1 max-w-64 text-sm font-bold leading-6 text-slate-500">
          {m.postDetail.followTeachersHint}
        </p>
        <Link className="tap-scale mt-4 inline-flex zigo-cta tap-scale rounded-lg px-5 py-3 text-sm font-black text-white" href="/explore">
          {m.postDetail.discoverMore}
        </Link>
      </section>
    );
  }

  return (
    <section className="-mx-4 border-t border-slate-100 bg-white px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{m.postDetail.morePosts}</p>
          <h2 className="mt-1 text-lg font-black text-night">{m.postDetail.fromFeed}</h2>
        </div>
        <Link className="text-xs font-black text-crystal" href="/explore">
          {m.nav.search}
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg bg-white">
        {posts.map((item, index) => (
          <Link className="group block text-[0.62rem] font-black text-white" href={`/post/${item.id}`} key={item.id}>
            <SocialMediaFrame
              className="aspect-square media-polish"
              gradient={
                index % 3 === 0
                  ? "from-crystal to-fuchsia-500"
                  : index % 3 === 1
                    ? "from-emerald-500 to-teal-500"
                    : "from-amber-400 to-orange-500"
              }
              mediaType={item.media_type}
              mediaUrl={item.media_url}
              scene={index % 3 === 0 ? "math" : index % 3 === 1 ? "science" : "coding"}
            >
              <div className="flex items-start justify-between">
                <span className="sr-only">
                  {item.is_reel || item.media_type === "video" ? "reel" : "post"}
                </span>
              </div>
              <div className="sr-only">
                <p className="truncate rounded-lg bg-black/35 px-2 py-1 backdrop-blur">
                  {item.caption}
                </p>
              </div>
            </SocialMediaFrame>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PreviewPostDetail({ messages: m }: { messages: Messages }) {
  return (
    <div className="space-y-0 pb-3">
      <article className="-mx-4 overflow-hidden border-b border-slate-100 bg-white">
        <DoubleTapLikeLink href="/post/preview">
          <SocialMediaFrame className="zigo-media">
            <div />
            <div />
          </SocialMediaFrame>
        </DoubleTapLikeLink>
        <div className="space-y-3 p-4">
          <p className="text-sm leading-6 text-slate-700">
            <span className="font-black text-night">zigocreator</span> {m.postDetail.previewPost}
          </p>
          <SocialPostActions initialComments={12} initialLikes={128} />
        </div>
      </article>
      <PostDetailQuickActions messages={m} postId="preview" />
      <MoreFromMatchFeed messages={m} posts={[]} />
    </div>
  );
}
