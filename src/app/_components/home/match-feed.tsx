import Link from "next/link";

import { DismissibleFeedPost } from "@/components/dismissible-feed-post";
import { DoubleTapLikeLink } from "@/components/double-tap-like-link";
import { FeedEducationBadges } from "@/components/feed-education-badges";
import { FollowButton } from "@/components/follow-button";
import { PostOptionsButton } from "@/components/post-options-button";
import { PremiumPrepLink } from "@/components/premium-prep-link";
import { SocialMediaFrame } from "@/components/social-media-frame";
import { SocialPostActions } from "@/components/social-post-actions";
import { SocialAvatar } from "@/components/social-primitives";
import { SponsoredAdLink } from "@/components/sponsored-ad-link";
import { TeacherTrustBadges } from "@/components/teacher-trust-badges";
import { formatFeedTimestamp } from "@/lib/format-time";
import type { Messages } from "@/lib/i18n/server";

import type { DisplayPost, DisplaySuggestedCreator } from "./data";

export function FeedPostCard({
  post,
  teacherBadges,
  feedExtras,
  feedEnhancements,
  priorityMedia = false,
}: {
  post: DisplayPost;
  teacherBadges: { verifiedTeacher: string; moreAreas: string };
  feedExtras: Messages["feedExtras"];
  feedEnhancements: Messages["feedEnhancements"];
  priorityMedia?: boolean;
}) {
  const postKey = post.postId ?? post.handle;

  return (
    <DismissibleFeedPost postKey={postKey}>
      <article className="zigo-feed-card -mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link className="flex min-w-0 flex-1 items-center gap-3" href={post.authorId ? `/profile/${post.authorId}` : "/profile"}>
            <SocialAvatar className="size-9" label={post.authorName} />
            <div className="min-w-0">
              <p className="truncate text-zigo-body font-bold text-night">{post.handle}</p>
              {post.verified ? (
                <div className="mt-1">
                  <TeacherTrustBadges
                    branches={post.area ? [post.area] : []}
                    moreLabel={teacherBadges.moreAreas}
                    showVerified
                    verified={post.verified}
                    verifiedLabel={teacherBadges.verifiedTeacher}
                  />
                </div>
              ) : (
                <p className="truncate text-zigo-meta font-semibold text-slate-600">{post.area}</p>
              )}
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <PostOptionsButton initialSaved={post.isSaved} postId={post.postId} postKey={postKey} />
          </div>
        </div>

        <DoubleTapLikeLink
          href={post.postId ? `/post/${post.postId}` : "/micro"}
          initialLiked={post.isLiked}
          postId={post.postId}
        >
          <SocialMediaFrame
            alt={post.caption.slice(0, 80)}
            className="zigo-media border-y border-slate-50"
            gradient={post.gradient}
            mediaType={post.mediaType}
            mediaUrl={post.mediaUrl}
            priority={priorityMedia}
            scene={post.scene}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="zigo-meta-badge rounded-full bg-black/25 px-2.5 py-1 text-white backdrop-blur">
                  {post.badge}
                </span>
                <span className="zigo-meta-badge rounded-full bg-white/20 px-2.5 py-1 text-white backdrop-blur">
                  {post.area}
                </span>
              </div>
              {post.mediaType === "video" ? (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-black/25 text-xs font-black text-white backdrop-blur">
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
            initialComments={post.comments}
            initialLiked={post.isLiked}
            initialLikes={post.likes}
            initialSaved={post.isSaved}
            postId={post.postId}
            variant="compact"
          />
          <FeedEducationBadges
            area={post.area}
            badge={post.badge}
            copy={feedEnhancements}
            isMicro={post.badge === "Micro" || post.mediaType === "video"}
            postId={post.postId}
          />
          <p className="text-zigo-body leading-relaxed text-slate-800">
            <span className="font-bold text-night">{post.handle}</span> {post.caption}
          </p>
          {post.showPremiumPrep && post.premiumPrepLabel && post.postId ? (
            <PremiumPrepLink
              canOpen={Boolean(post.canOpenPremiumPrep)}
              label={post.premiumPrepLabel}
              postId={post.postId}
            />
          ) : null}
          {post.showSponsored && post.sponsoredLabel && post.postId ? (
            <SponsoredAdLink
              canOpen={Boolean(post.canOpenSponsored)}
              disclosure={post.sponsoredDisclosure}
              isActive={post.isSponsoredActive ?? true}
              label={post.sponsoredLabel}
              postId={post.postId}
            />
          ) : null}
          <Link className="block text-sm font-semibold text-slate-600" href={post.postId ? `/post/${post.postId}` : "/micro"}>
            {post.comments > 0
              ? feedExtras.viewAllComments.replace("{count}", post.comments.toLocaleString())
              : feedExtras.addFirstComment}
          </Link>
          <p className="text-zigo-meta font-semibold uppercase tracking-wide text-slate-500">
            {formatFeedTimestamp(post.createdAt)}
          </p>
        </div>
      </article>
    </DismissibleFeedPost>
  );
}

export function CreatorRail({
  creators,
  label,
  seeAll,
}: {
  creators: DisplaySuggestedCreator[];
  label: string;
  seeAll: string;
}) {
  return (
    <section className="-mx-4 px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-zigo-body font-bold text-night">{label}</p>
        <Link className="text-zigo-caption font-bold text-crystal" href="/explore?format=teachers">
          {seeAll}
        </Link>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto">
        {creators.map((creator) => (
          <article className="min-w-28 text-center" key={creator.id ?? creator.handle}>
            <Link className="tap-scale block" href={creator.href}>
              <SocialAvatar className="mx-auto size-16" label={creator.name} />
              <p className="zigo-fit-text mt-2 text-zigo-caption font-bold text-night">{creator.handle}</p>
              <p className="zigo-fit-text mt-0.5 text-zigo-meta text-slate-600">{creator.area}</p>
            </Link>
            <div className="mt-2 flex justify-center">
              <FollowButton
                followingId={creator.id}
                initialFollowing={creator.isFollowing}
                variant="compact"
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function FollowingStarter({
  creators,
  messages,
}: {
  creators: DisplaySuggestedCreator[];
  messages: Messages;
}) {
  const f = messages.feedExtras;
  return (
    <section className="-mx-4 px-6 py-14 text-center">
      <span className="mx-auto flex size-20 items-center justify-center rounded-lg border-2 border-night text-2xl font-black text-night">
        +
      </span>
      <h2 className="zigo-section-title mt-4 text-night">{f.followCreators}</h2>
      <p className="mx-auto mt-2 max-w-72 text-zigo-body leading-relaxed text-slate-600">{f.followCreatorsDesc}</p>
      <Link className="tap-scale mt-4 inline-flex zigo-cta tap-scale rounded-lg px-5 py-2.5 text-zigo-body font-bold text-white" href="/explore?q=Teachers">
        {f.exploreTeachers}
      </Link>
      <div className="no-scrollbar mt-6 flex gap-3 overflow-x-auto pb-1 text-left">
        {creators.map((creator) => (
          <article className="min-w-32 rounded-lg border border-slate-200 bg-white p-3" key={creator.id ?? creator.handle}>
            <Link className="tap-scale block" href={creator.href}>
              <SocialAvatar className="size-10" label={creator.name} ring={false} />
              <p className="zigo-fit-text mt-3 text-zigo-body font-bold text-night">@{creator.handle}</p>
              <p className="mt-1 text-zigo-caption text-slate-600">{creator.area}</p>
            </Link>
            <div className="mt-3">
              <FollowButton followingId={creator.id} initialFollowing={creator.isFollowing} variant="compact" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ForYouStarter({ messages }: { messages: Messages }) {
  const f = messages.feedExtras;
  const o = messages.onboarding;
  return (
    <section className="-mx-4 px-6 py-14 text-center">
      <span className="mx-auto flex size-20 items-center justify-center rounded-lg bg-gradient-to-br from-crystal to-fuchsia-500 text-2xl font-black text-white">
        Z
      </span>
      <h2 className="zigo-section-title mt-4 text-night">{f.buildFeed}</h2>
      <p className="mx-auto mt-2 max-w-72 text-zigo-body leading-relaxed text-slate-600">{f.buildFeedDesc}</p>
      <Link className="tap-scale mt-4 inline-flex zigo-cta tap-scale rounded-lg px-5 py-2.5 text-zigo-body font-bold text-white" href="/onboarding">
        {o.chooseInterests}
      </Link>
    </section>
  );
}
