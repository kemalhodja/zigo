"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import type { DisplayPost } from "@/app/_components/home/data";
import { FollowButton } from "@/components/follow-button";
import { ReelActionRail } from "@/components/reel-action-rail";
import { ReelVideoPlayer } from "@/components/reel-video-player";
import { SocialMediaFrame } from "@/components/social-media-frame";
import { SocialMediaScene } from "@/components/social-media-scenes";
import { VerifiedBadge } from "@/components/social-primitives";
import type { Messages } from "@/lib/i18n/server";

type ExploreFeedViewerProps = {
  posts: DisplayPost[];
  messages: Messages;
};

export function ExploreFeedViewer({ posts, messages }: ExploreFeedViewerProps) {
  const router = useRouter();

  if (posts.length === 0) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-black text-white">
        <p className="font-bold">Gönderi bulunamadı.</p>
        <button onClick={() => router.back()} className="mt-4 rounded-xl bg-white/20 px-4 py-2 font-black">
          Geri Dön
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Fixed Header */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex w-full justify-between p-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] text-white">
        <button 
          onClick={() => router.back()} 
          className="pointer-events-auto flex items-center gap-2 drop-shadow-md transition-transform active:scale-95"
        >
          <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-lg font-black tracking-wide">Keşfet</span>
        </button>
      </div>

      <div className="h-dvh snap-y snap-mandatory overflow-y-auto bg-black">
        {posts.map((post, index) => (
          <ExploreReelSection
            index={index}
            key={post.postId ?? index}
            messages={messages}
            post={post}
          />
        ))}
      </div>
    </>
  );
}

function ExploreReelSection({
  index,
  post,
}: {
  index: number;
  messages: Messages;
  post: DisplayPost;
}) {
  return (
    <section className="relative flex h-dvh w-full shrink-0 snap-start snap-always flex-col justify-end overflow-hidden bg-black pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]">
      {/* Video Background */}
      {post.mediaUrl && post.mediaType === "video" ? (
        <ReelVideoPlayer mediaUrl={post.mediaUrl} reelId={post.postId ?? `reel-${index}`} />
      ) : post.mediaUrl ? (
        <div className={`absolute inset-0 bg-gradient-to-br ${post.gradient}`}>
          <SocialMediaFrame
            alt={post.caption.slice(0, 80)}
            className="size-full"
            gradient={post.gradient}
            mediaType={post.mediaType}
            mediaUrl={post.mediaType !== "carousel" ? post.mediaUrl : undefined}
            mediaUrls={post.mediaType === "carousel" ? (() => {
              try { return JSON.parse(post.mediaUrl); } catch { return [post.mediaUrl]; }
            })() : undefined}
            scene={post.scene ?? "math"}
            objectFit="contain"
          />
        </div>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${post.gradient}`}>
          <SocialMediaScene scene={post.scene ?? "math"} />
        </div>
      )}

      {/* Gradient Overlay for Text Readability */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Action Rail (Right Side) */}
      <div className="pointer-events-auto">
        <ReelActionRail
          comments={post.comments}
          creator={post.handle}
          initialLiked={post.isLiked}
          initialLikesCount={post.likes}
          initialSaved={post.isSaved}
          likes={String(post.likes)}
          postId={post.postId}
        />
      </div>

      {/* Bottom Content Area */}
      <div className="pointer-events-auto relative z-10 w-full px-4 pr-16 pb-4">
        {/* Creator Info */}
        <div className="mb-2 flex items-center gap-2">
          <Link
            className="tap-scale flex min-w-0 items-center gap-1.5 text-white drop-shadow-md"
            href={`/profile/${post.authorId ?? ""}`}
          >
            <p className="truncate text-base font-black">@{post.handle}</p>
            {post.verified && <VerifiedBadge className="size-4" />}
          </Link>
          {post.canFollowCreator && post.authorId && (
            <FollowButton
              followingId={post.authorId}
              initialFollowing={post.isFollowingCreator}
              variant="overlay"
            />
          )}
        </div>

        {/* Caption */}
        <p className="mb-4 text-sm font-semibold leading-relaxed text-white/95 drop-shadow-md line-clamp-3">
          {post.caption}
        </p>
      </div>

      {/* Fixed Bottom Input Area */}
      <div className="pointer-events-auto relative z-10 w-full px-4 pb-2">
        <CommentTrigger postId={post.postId} />
      </div>
    </section>
  );
}
function CommentTrigger({ postId }: { postId?: string }) {
  const handleOpenComments = () => {
    const btnId = `comment-btn-${postId ?? "preview"}`;
    document.getElementById(btnId)?.click();
  };

  return (
    <button 
      onClick={handleOpenComments}
      className="tap-scale flex w-full items-center gap-3 rounded-full bg-black/40 px-4 py-3 text-left text-sm font-bold text-white/70 backdrop-blur-md border border-white/10"
    >
      <svg aria-hidden="true" className="size-5 text-white/50" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
      Yorum Ekle...
    </button>
  );
}
