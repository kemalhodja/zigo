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
  viewerRole = null,
  enterDelayMs = 0,
}: {
  post: DisplayPost;
  teacherBadges: { verifiedTeacher: string; moreAreas: string };
  feedExtras: Messages["feedExtras"];
  feedEnhancements: Messages["feedEnhancements"];
  priorityMedia?: boolean;
  viewerRole?: import("@/lib/supabase/database.types").UserRole | "guest" | null;
  enterDelayMs?: number;
}) {
  const postKey = post.postId ?? post.handle;
  const isMicro = post.badge === "Micro" || post.mediaType === "video";

  return (
    <DismissibleFeedPost postKey={postKey}>
      <article
        className="zigo-feed-card zigo-feed-card-enter -mx-4 overflow-hidden"
        style={enterDelayMs > 0 ? { animationDelay: `${enterDelayMs}ms` } : undefined}
      >
        <DoubleTapLikeLink
          href={post.postId ? `/post/${post.postId}` : "/micro"}
          initialLiked={post.isLiked}
          postId={post.postId}
        >
          <SocialMediaFrame
            alt={post.caption.slice(0, 80)}
            className="zigo-media"
            gradient={post.gradient}
            mediaType={post.mediaType}
            mediaUrl={post.mediaUrl}
            priority={priorityMedia}
            scene={post.scene}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="zigo-meta-badge rounded-full bg-black/30 px-2.5 py-1 text-white backdrop-blur-md">
                {isMicro ? feedEnhancements.oneMinLesson : post.area}
              </span>
              {post.mediaType === "video" ? (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black/35 text-xs font-black text-white backdrop-blur-md">
                  <svg aria-hidden="true" className="ml-0.5 size-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              ) : null}
            </div>
            <div />
          </SocialMediaFrame>
        </DoubleTapLikeLink>

        <div className="flex items-center justify-between px-4 py-2.5">
          <Link className="flex min-w-0 flex-1 items-center gap-3" href={post.authorId ? `/profile/${post.authorId}` : "/profile"}>
            <SocialAvatar className="size-9" label={post.authorName} imageUrl={post.avatarUrl} online={post.verified} />
            <div className="min-w-0">
              <p className="truncate text-zigo-body font-bold text-night">
                {post.handle}
                {post.coAuthorName ? ` & ${post.coAuthorName.toLowerCase().replaceAll(" ", "")}` : ""}
              </p>
              {post.verified ? (
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <TeacherTrustBadges
                    branches={post.area ? [post.area] : []}
                    moreLabel={teacherBadges.moreAreas}
                    showVerified
                    verified={post.verified}
                    verifiedLabel={teacherBadges.verifiedTeacher}
                  />
                  {post.locationName || post.city ? (
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.62rem] font-bold text-slate-600">
                      📍 {post.locationName || post.city}
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-zigo-meta font-semibold text-slate-600">{post.area}</p>
                  {post.locationName || post.city ? (
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.62rem] font-bold text-slate-600">
                      📍 {post.locationName || post.city}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            {post.canFollowCreator && post.authorId && !post.isOwner ? (
              <FollowButton
                followingId={post.authorId}
                initialFollowing={post.isFollowingCreator}
                variant="compact"
              />
            ) : null}
            <PostOptionsButton initialAreaId={post.areaId} initialCaption={post.caption} initialLocationName={post.locationName ?? undefined} initialSaved={post.isSaved} isOwner={post.isOwner} postId={post.postId} postKey={postKey} />
          </div>
        </div>

        <div className="space-y-2 px-4 pb-3">
          <SocialPostActions
            initialComments={post.comments}
            initialLiked={post.isLiked}
            initialLikes={post.likes}
            initialSaved={post.isSaved}
            postId={post.postId}
            variant="compact"
          />
          <p className="zigo-fit-text text-zigo-body leading-relaxed text-slate-800">
            <span className="font-bold text-night">{post.handle}</span>{" "}
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
                  <a key={i} className="font-semibold text-crystal" href={`/tag/${encodeURIComponent(tag)}`}>
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
          {(() => {
            const extUrl = (post as Record<string, unknown>).externalUrl as string | undefined || (post as Record<string, unknown>).external_url as string | undefined;
            return extUrl ? (
              <a href={extUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block w-full rounded-xl bg-crystal py-2.5 text-center font-bold text-white shadow-sm hover:bg-crystal-dark transition-colors">
                Bağlantıya Git
              </a>
            ) : null;
          })()}
          <FeedEducationBadges
            area={post.area}
            badge={post.badge}
            copy={feedEnhancements}
            isMicro={isMicro}
            postId={post.postId}
            viewerRole={viewerRole}
          />
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
    <section className="zigo-empty-hero -mx-4 px-6 py-12 text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-night text-2xl font-black text-white shadow-lg shadow-slate-900/20">
        +
      </span>
      <h2 className="zigo-section-title mt-5 text-night">{f.followCreators}</h2>
      <p className="mx-auto mt-2 max-w-72 text-zigo-body leading-relaxed text-slate-600">{f.followCreatorsDesc}</p>
      <Link className="tap-scale zigo-cta mt-5 inline-flex rounded-xl px-5 py-2.5 text-zigo-body font-bold text-white" href="/explore?q=Teachers">
        {f.exploreTeachers}
      </Link>
      <div className="no-scrollbar mt-7 flex gap-3 overflow-x-auto pb-1 text-left">
        {creators.map((creator) => (
          <article className="min-w-32 rounded-xl border border-slate-200/80 bg-white/90 p-3 shadow-sm" key={creator.id ?? creator.handle}>
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
    <section className="zigo-empty-hero -mx-4 px-6 py-12 text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-crystal to-berry text-2xl font-black text-white shadow-lg shadow-crystal/25">
        Z
      </span>
      <h2 className="zigo-section-title mt-5 text-night">{f.buildFeed}</h2>
      <p className="mx-auto mt-2 max-w-72 text-zigo-body leading-relaxed text-slate-600">{f.buildFeedDesc}</p>
      <Link className="tap-scale zigo-cta mt-5 inline-flex rounded-xl px-5 py-2.5 text-zigo-body font-bold text-white" href="/onboarding">
        {o.chooseInterests}
      </Link>
    </section>
  );
}
