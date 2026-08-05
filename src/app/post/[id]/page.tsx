import Link from "next/link";
import { notFound } from "next/navigation";

import { DoubleTapLikeLink } from "@/components/double-tap-like-link";
import { PostOptionsButton } from "@/components/post-options-button";
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
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link
            className="tap-scale flex min-w-0 flex-1 items-center gap-3"
            href={post.author?.id ? `/profile/${post.author.id}` : "/profile"}
          >
            <SocialAvatar className="size-9 shrink-0" label={creator} imageUrl={post.author?.avatar_url} />
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
          <div className="shrink-0 pl-2">
            <PostOptionsButton
              initialAreaId={post.area_id ?? undefined}
              initialCaption={post.caption}
              initialSaved={post.is_saved}
              isOwner={Boolean(profile?.id && post.author?.id && profile.id === post.author.id)}
              postId={post.id}
            />
          </div>
        </div>

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
            <span className="font-black text-night">{creator}</span>{" "}
            {post.caption.split(/(https?:\/\/[^\s]+|#[\w\u00C0-\u024F\u1E00-\u1EFF]+|@[\w]+)/g).map((part, i) => {
              if (/^https?:\/\//i.test(part)) {
                return (
                  <a key={i} className="break-all text-blue-500 hover:underline" href={part} rel="noopener noreferrer" target="_blank">
                    {part}
                  </a>
                );
              }
              if (/^#[\w\u00C0-\u024F\u1E00-\u1EFF]+/.test(part)) {
                const tag = part.slice(1);
                return (
                  <a key={i} className="font-semibold text-crystal" href={`/explore?q=${encodeURIComponent(tag)}`}>
                    {part}
                  </a>
                );
              }
              if (/^@\w+/.test(part)) {
                return (
                  <a key={i} className="font-semibold text-crystal" href={`/explore?q=${encodeURIComponent(part.slice(1))}&format=teachers`}>
                    {part}
                  </a>
                );
              }
              return part;
            })}
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
                <SocialAvatar className="size-8" label={comment.author?.full_name ?? m.postDetail.zigoUser} imageUrl={comment.author?.avatar_url} ring={false} />
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
          <Link className="group relative block text-[0.62rem] font-black text-white" href={`/post/${item.id}`} key={item.id}>
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
                {item.is_reel || item.media_type === "video" ? (
                  <span className="flex size-6 items-center justify-center rounded-md bg-black/30 backdrop-blur">
                    <svg aria-hidden="true" className="ml-0.5 size-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                ) : <span />}
              </div>
              <div />
            </SocialMediaFrame>
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100">
              <span className="flex items-center gap-1 text-xs font-black">
                <svg aria-hidden="true" className="size-3.5 fill-white" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                {item.likes_count.toLocaleString("tr-TR")}
              </span>
              <span className="flex items-center gap-1 text-xs font-black">
                <svg aria-hidden="true" className="size-3.5 fill-white" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                {item.comments_count.toLocaleString("tr-TR")}
              </span>
            </div>
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
