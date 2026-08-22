"use client";

import Link from "next/link";
import { useState } from "react";

import { DismissibleFeedPost } from "@/components/dismissible-feed-post";
import { FeedEducationBadges } from "@/components/feed-education-badges";
import { FollowButton } from "@/components/follow-button";
import { SocialPostActions } from "@/components/social-post-actions";
import { SocialAvatar } from "@/components/social-primitives";
import { SponsoredAdLink } from "@/components/sponsored-ad-link";
import { useFeedPostState } from "@/hooks/use-feed-post-state";
import { formatFeedTimestamp } from "@/lib/format-time";
import type { Messages } from "@/lib/i18n/server";
import type { UserRole } from "@/lib/supabase/database.types";

import type { DisplayPost, DisplaySuggestedCreator } from "./data";
import { FeedMediaViewer } from "./feed-media-viewer";
import { FeedPostHeader } from "./feed-post-header";

export function FeedPostCard({
  post,
  teacherBadges,
  feedExtras,
  feedEnhancements,
  priorityMedia = false,
  viewerRole = null,
  enterDelayMs = 0,
  fullHeight = false,
}: {
  post: DisplayPost;
  teacherBadges: { verifiedTeacher: string; moreAreas: string };
  feedExtras: Messages["feedExtras"];
  feedEnhancements: Messages["feedEnhancements"];
  priorityMedia?: boolean;
  viewerRole?: UserRole | "guest" | null;
  enterDelayMs?: number;
  fullHeight?: boolean;
}) {
  const postKey = post.postId ?? post.handle;
  const isMicro = post.badge === "Micro" || post.mediaType === "video";
  const { containerStyle } = useFeedPostState(enterDelayMs);

  const heightClass = fullHeight ? "h-[100dvh] md:h-[100dvh]" : "h-[calc(100dvh-70px)] md:h-[700px]";

  return (
    <DismissibleFeedPost postKey={postKey}>
      <article className="zigo-feed-card zigo-feed-card-enter relative mb-0 bg-white pb-4 border-b border-slate-100" style={containerStyle}>
        <FeedPostHeader post={post} postKey={postKey} teacherBadges={teacherBadges} theme="light" />
        <div className="relative aspect-square w-full bg-slate-50 border-y border-slate-100">
          <FeedMediaViewer post={post} priorityMedia={priorityMedia} isMicro={false} oneMinLessonLabel={feedEnhancements.oneMinLesson} />
        </div>
        <div className="px-4 mt-3 space-y-2">
          <SocialPostActions initialComments={post.comments} initialLiked={post.isLiked} initialLikes={post.likes} initialSaved={post.isSaved} postId={post.postId} variant="compact" theme="light" />
        </div>
        <div className="mt-2">
          <ExpandableCaption caption={post.caption} handle={post.handle} theme="light" />
        </div>
        <div className="px-4 mt-1">
          <p className="text-zigo-meta font-semibold uppercase tracking-wide text-slate-500">
            {formatFeedTimestamp(post.createdAt)}
          </p>
        </div>
      </article>
    </DismissibleFeedPost>
  );
}

function ExpandableCaption({ caption, handle, theme = "dark" }: { caption?: string | null; handle?: string; theme?: "dark" | "light" }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!caption) return null;

  const isDark = theme === "dark";
  const bgClass = isDark ? "bg-black/60 text-white shadow-lg" : "bg-white text-night";
  const clampedTextClass = isDark ? "text-white/90" : "text-slate-800";
  const readMoreClass = isDark ? "text-white/60 hover:text-white" : "text-slate-500 hover:text-slate-800";

  return (
    <div 
      className="pointer-events-auto px-4 pb-2"
      onClick={() => setExpanded(!expanded)}
    >
      <div className={`cursor-pointer text-[0.85rem] transition-all duration-200 ${
        expanded 
          ? `max-h-[50vh] overflow-y-auto ${isDark ? 'rounded-xl p-3.5 backdrop-blur-md' : ''} ${bgClass}` 
          : `line-clamp-2 ${clampedTextClass} ${isDark ? 'drop-shadow-md' : ''}`
      }`}>
        {handle && <span className="font-bold mr-1.5">{handle}</span>}
        {caption}
      </div>
      {!expanded && caption.length > 50 ? (
        <span className={`mt-0.5 cursor-pointer text-xs font-bold drop-shadow-sm transition-colors ${readMoreClass}`}>
          ... devamı
        </span>
      ) : null}
    </div>
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
    <section className="px-4 py-4 bg-white border-b border-slate-100">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-zigo-body font-bold text-slate-900">{label}</p>
        <Link className="text-zigo-caption font-bold text-crystal" href="/explore?format=teachers">
          {seeAll}
        </Link>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto">
        {creators.map((creator) => (
          <article className="min-w-28 text-center" key={creator.id ?? creator.handle}>
            <Link className="tap-scale block" href={creator.href}>
              <SocialAvatar className="mx-auto size-16" label={creator.name} />
              <p className="zigo-fit-text mt-2 text-zigo-caption font-bold text-slate-900">{creator.handle}</p>
              <p className="zigo-fit-text mt-0.5 text-zigo-meta text-slate-500">{creator.area}</p>
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
    <section className="zigo-empty-hero px-6 py-12 text-center bg-white border-b border-slate-100">
      <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-slate-50 text-2xl font-black text-slate-400 shadow-lg shadow-slate-100 border border-slate-100">
        +
      </span>
      <h2 className="zigo-section-title mt-5 text-slate-900">{f.buildFeed || "Akışını Oluştur"}</h2>
      <p className="mx-auto mt-2 max-w-72 text-zigo-body leading-relaxed text-slate-500">{f.buildFeedDesc || "İlgi alanlarını seçerek veya öğretmenleri takip ederek akışını oluştur."}</p>
      <Link className="tap-scale zigo-cta mt-5 inline-flex rounded-xl px-5 py-2.5 text-zigo-body font-bold text-white bg-crystal" href="/onboarding">
        İlgi alanını seç
      </Link>
      <div className="no-scrollbar mt-7 flex gap-3 overflow-x-auto pb-1 text-left">
        {creators.map((creator) => (
          <article className="min-w-32 rounded-xl border border-slate-100 bg-white p-3 shadow-sm" key={creator.id ?? creator.handle}>
            <Link className="tap-scale block" href={creator.href}>
              <SocialAvatar className="size-10" label={creator.name} ring={false} />
              <p className="zigo-fit-text mt-3 text-zigo-body font-bold text-slate-900">@{creator.handle}</p>
              <p className="mt-1 text-zigo-caption text-slate-500">{creator.area}</p>
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
    <section className="zigo-empty-hero px-6 py-12 text-center">
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
