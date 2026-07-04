import Link from "next/link";

import { FollowButton } from "@/components/follow-button";
import { ReelActionRail } from "@/components/reel-action-rail";
import { ReelLearningPoints } from "@/components/reel-learning-points";
import { ReelVideoPlayer } from "@/components/reel-video-player";
import { SocialMediaScene } from "@/components/social-media-scenes";
import { SocialPill, VerifiedBadge } from "@/components/social-primitives";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { allowDemoContent } from "@/lib/domain/demo-env";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getFollowingFeed, getReelFeed, isFollowing, type SocialFeedPost } from "@/lib/domain/social";
import { getServerMessages } from "@/lib/i18n/server";
import type { Messages } from "@/lib/i18n/types";
import { createClient } from "@/lib/supabase/server";

function buildDemoReels(d: Messages["demo"]) {
  return [
    {
      creator: "aylinmath",
      title: d.reel1Title,
      caption: d.reel1Caption,
      color: "from-violet-600 via-fuchsia-500 to-rose-400",
      likes: "12.4K",
      scene: "math" as const,
    },
    {
      creator: "sciencewithmert",
      title: d.reel2Title,
      caption: d.reel2Caption,
      color: "from-emerald-500 via-teal-500 to-cyan-500",
      likes: "8.9K",
      scene: "science" as const,
    },
    {
      creator: "codingclub",
      title: d.reel3Title,
      caption: d.reel3Caption,
      color: "from-amber-400 via-orange-500 to-rose-500",
      likes: "6.1K",
      scene: "coding" as const,
    },
  ];
}

type ReelItem = {
  id: string;
  creator: string;
  creatorId?: string;
  title: string;
  caption: string;
  color: string;
  likes: string;
  mediaUrl?: string | null;
  mediaType?: string;
  scene: "math" | "science" | "coding";
  verified: boolean;
  postId?: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  isFollowingCreator: boolean;
  isOwnCreator: boolean;
};

type ReelsPageProps = {
  searchParams: Promise<{ feed?: string }>;
};

export default async function ReelsPage({ searchParams }: ReelsPageProps) {
  const m = await getServerMessages();
  const params = await searchParams;
  const activeFeed = params.feed === "following" ? "following" : "for-you";
  const reels = await getReels(activeFeed);

  return (
  <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 mx-auto flex w-full max-w-md justify-center px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="pointer-events-auto flex items-center justify-center gap-1 text-sm font-black text-white">
          <ReelFeedTabs activeFeed={activeFeed} messages={m} />
        </div>
      </div>
    <div className="h-dvh snap-y snap-mandatory overflow-y-auto bg-night">
      {reels.length === 0 ? (
        <ReelsEmptyState activeFeed={activeFeed} messages={m} />
      ) : (
        reels.map((reel, index) => (
          <ReelSection activeFeed={activeFeed} index={index} key={reel.id} messages={m} reel={reel} />
        ))
      )}
    </div>
  </>
  );
}

function ReelSection({
  activeFeed,
  index,
  messages: m,
  reel,
}: {
  activeFeed: "for-you" | "following";
  index: number;
  messages: Messages;
  reel: ReelItem;
}) {
  const mp = m.microPage;
  const ru = m.reelUi;

  return (
    <section
      className={`safe-top relative flex min-h-dvh snap-start flex-col justify-end overflow-hidden bg-gradient-to-br ${reel.color} px-5 pb-28 pt-14 text-white`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.2),transparent_18rem)]" />
      {reel.mediaUrl && reel.mediaType === "video" ? (
        <ReelVideoPlayer mediaUrl={reel.mediaUrl} reelId={reel.postId ?? reel.id} />
      ) : null}
      {!reel.mediaUrl ? <ReelScene scene={reel.scene} /> : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/10 to-black/24" />
      <div className="relative z-10 px-1">
        <div className="h-1 overflow-hidden rounded-lg bg-white/20">
          <span className="block h-full w-2/3 rounded-lg bg-gradient-to-r from-white via-mint to-aqua" />
        </div>
        <div className="mt-2 flex items-center justify-between text-[0.62rem] font-black uppercase tracking-[0.16em] text-white/70">
          <span>{m.zigo.microLesson}</span>
          <span>{mp.afterWatchPoints}</span>
        </div>
      </div>
      <ReelContextOverlay activeFeed={activeFeed} index={index} messages={m} reel={reel} />

      <ReelActionRail
        comments={reel.commentsCount}
        creator={reel.creator}
        initialLiked={reel.isLiked}
        initialLikesCount={reel.likesCount}
        initialSaved={reel.isSaved}
        likes={reel.likes}
        postId={reel.postId}
      />

      <div className="relative max-w-[18.7rem] space-y-3 pr-12">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-black">@{reel.creator}</p>
          {reel.verified ? <VerifiedBadge className="size-4" /> : null}
          {reel.creatorId && !reel.isOwnCreator ? (
            <FollowButton
              followingId={reel.creatorId}
              initialFollowing={reel.isFollowingCreator}
              variant="overlay"
            />
          ) : null}
        </div>
        <p className="text-sm leading-5 text-white/90">
          <span className="font-black">{reel.title}.</span> {reel.caption}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <SocialPill tone="glass">{ru.creatorAudio}</SocialPill>
          <span className="rounded-lg bg-black/20 px-3 py-1 text-xs font-black text-white/70 backdrop-blur">
            {ru.watchForPoints}
          </span>
        </div>
        <ReelLearningDock messages={m} postId={reel.postId} />
        <div className="text-xs font-black text-white/80">
          <ReelLearningPoints
            reelId={reel.postId ?? reel.id}
            requiresPlayback={Boolean(reel.mediaUrl && reel.mediaType === "video")}
          />
        </div>
      </div>
      {index === 0 ? (
        <div className="pointer-events-none absolute bottom-20 left-1/2 z-10 -translate-x-1/2 text-center text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/50">
          {mp.swipeUp}
        </div>
      ) : null}
    </section>
  );
}

function ReelContextOverlay({
  activeFeed,
  index,
  messages,
  reel,
}: {
  activeFeed: "for-you" | "following";
  index: number;
  messages: Messages;
  reel: ReelItem;
}) {
  const mp = messages.microPage;
  return (
    <aside className="hidden">
      <p className="text-[0.56rem] font-black uppercase tracking-[0.16em] text-white/55">{messages.nav.micro}</p>
      <p className="mt-1 truncate text-xs font-black">{activeFeed === "following" ? mp.followingLane : mp.matchFeedLane}</p>
      <div className="mt-3 space-y-2 text-[0.58rem] font-black uppercase tracking-[0.08em] text-white/65">
        <div className="flex items-center justify-between gap-2">
          <span>{mp.creatorLabel}</span>
          <span className="truncate text-white">@{reel.creator}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>{mp.nextLabel}</span>
          <span className="text-mint">+10</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-white/15">
          <span className="block h-full rounded-full bg-gradient-to-r from-mint to-aqua" style={{ width: `${Math.min(92, 34 + index * 18)}%` }} />
        </div>
      </div>
    </aside>
  );
}

function ReelLearningDock({ messages, postId }: { messages: Messages; postId?: string }) {
  const mp = messages.microPage;
  const actions = [
    { href: "/learn", label: mp.dockQuiz, meta: mp.dockPts },
    { href: "/collections", label: mp.dockSave, meta: mp.dockSaved },
    { href: postId ? `/post/${postId}` : "/questions", label: mp.dockAsk, meta: mp.dockQa },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-2 backdrop-blur">
      <div className="mb-2 flex items-center justify-between px-1 text-[0.65rem] font-black uppercase tracking-[0.1em] text-white/70">
        <span>{mp.watchLoop}</span>
        <span>{mp.verifiedLabel}</span>
      </div>
      <div className="zigo-action-grid text-center text-xs font-black">
        {actions.map((action) => (
          <Link className="zigo-action-chip tap-scale min-h-0 rounded-xl bg-white/12 px-1.5 py-2 text-white" href={action.href} key={action.label}>
            <span className="block leading-tight">{action.label}</span>
            <span className="mt-0.5 block text-[0.65rem] font-bold leading-tight text-white/70">{action.meta}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ReelFeedTabs({ activeFeed, messages: m }: { activeFeed: "for-you" | "following"; messages: Messages }) {
  const mp = m.microPage;
  return (
    <>
      <Link
        className={`rounded-lg px-4 py-2 ${
          activeFeed === "following" ? "bg-crystal/90 text-white shadow-sm" : "text-white/80 hover:text-white"
        }`}
        href="/micro?feed=following"
      >
        {mp.following}
      </Link>
      <Link
        className={`rounded-lg px-4 py-2 ${
          activeFeed === "for-you" ? "bg-crystal/90 text-white shadow-sm" : "text-white/80 hover:text-white"
        }`}
        href="/micro"
      >
        {mp.forYou}
      </Link>
    </>
  );
}

function ReelsEmptyState({ activeFeed, messages: m }: { activeFeed: "for-you" | "following"; messages: Messages }) {
  const mp = m.microPage;
  const isFollowing = activeFeed === "following";

  return (
    <section className="safe-top flex min-h-dvh flex-col items-center justify-center bg-night px-8 text-center text-white">
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-center gap-1 px-5 pt-[calc(env(safe-area-inset-top)+0.8rem)] text-sm font-black text-white">
        <ReelFeedTabs activeFeed={activeFeed} messages={m} />
      </div>
      <span className="flex size-20 items-center justify-center rounded-lg border-2 border-white/90 text-white">
        <svg aria-hidden="true" className="ml-1 size-9" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      <h1 className="zigo-title-lg mt-6 font-black">
        {isFollowing ? mp.noFollowedMicro : mp.noMicroYet}
      </h1>
      <p className="mt-3 max-w-xs text-sm font-semibold leading-6 text-white/65">
        {isFollowing ? mp.followCreatorsHint : mp.noMicroInterests}
      </p>
      <Link
        className="tap-scale mt-6 rounded-lg bg-white px-5 py-3 text-sm font-black text-night"
        href={isFollowing ? "/explore?q=Teachers" : "/onboarding"}
      >
        {isFollowing ? mp.discoverCreators : mp.chooseInterests}
      </Link>
    </section>
  );
}

async function getReels(activeFeed: "for-you" | "following"): Promise<ReelItem[]> {
  const m = await getServerMessages();

  if (!hasSupabaseEnv()) {
    if (!allowDemoContent()) return [];
    return buildDemoReels(m.demo).map((reel) => ({
      ...reel,
      id: reel.creator,
      mediaType: "preview",
      verified: true,
      likesCount: Number.parseFloat(reel.likes) * 1000,
      commentsCount: 24,
      isLiked: false,
      isSaved: false,
      isFollowingCreator: false,
      isOwnCreator: false,
    }));
  }

  const demoFallback = allowDemoContent()
    ? buildDemoReels(m.demo).map((reel) => ({
        ...reel,
        id: reel.creator,
        mediaType: "preview" as const,
        verified: true,
        likesCount: Number.parseFloat(reel.likes) * 1000,
        commentsCount: 24,
        isLiked: false,
        isSaved: false,
        isFollowingCreator: false,
        isOwnCreator: false,
      }))
    : [];

  return withSupabaseFallback(async () => {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  const reels =
    activeFeed === "following" && profile
      ? (await getFollowingFeed(supabase, profile.id)).filter((post) => post.is_reel || post.media_type === "video")
      : await getReelFeed(supabase, profile?.id);

  if (reels.length === 0) return [];

  const followingByReel = await Promise.all(
    reels.map((reel) =>
      profile?.id && reel.author?.id && profile.id !== reel.author.id
        ? isFollowing(supabase, profile.id, reel.author.id)
        : Promise.resolve(false),
    ),
  );

  return reels.map((reel, index) => toReelItem(reel, index, m.actions.zigoCreator, m.microPage.newReelFallback, {
    isFollowingCreator: followingByReel[index] ?? false,
    viewerId: profile?.id,
  }));
  }, demoFallback, []);
}

function toReelItem(
  reel: SocialFeedPost,
  index: number,
  creatorFallback: string,
  newReelFallback: string,
  context: { isFollowingCreator: boolean; viewerId?: string } = { isFollowingCreator: false },
): ReelItem {
  const creatorName = reel.author?.full_name ?? creatorFallback;

  return {
    id: reel.id,
    postId: reel.id,
    creator: creatorName.toLowerCase().replaceAll(" ", ""),
    creatorId: reel.author?.id,
    title: reel.caption.split(".")[0] || newReelFallback,
    caption: reel.caption,
    color:
      index % 3 === 0
        ? "from-violet-600 via-fuchsia-500 to-rose-400"
        : index % 3 === 1
          ? "from-emerald-500 via-teal-500 to-cyan-500"
          : "from-amber-400 via-orange-500 to-rose-500",
    likes: new Intl.NumberFormat("en-US").format(reel.likes_count),
    likesCount: reel.likes_count,
    commentsCount: reel.comments_count,
    isLiked: reel.is_liked,
    isSaved: reel.is_saved,
    isFollowingCreator: context.isFollowingCreator,
    isOwnCreator: Boolean(context.viewerId && reel.author?.id === context.viewerId),
    mediaUrl: reel.media_url,
    mediaType: reel.media_type,
    scene: index % 3 === 0 ? "math" : index % 3 === 1 ? "science" : "coding",
    verified: Boolean(reel.author?.is_verified),
  };
}

function ReelScene({ scene }: { scene: ReelItem["scene"] }) {
  return <SocialMediaScene scene={scene} />;
}
