import { DoubleTapLikeLink } from "@/components/double-tap-like-link";
import { SocialMediaFrame } from "@/components/social-media-frame";

import type { DisplayPost } from "./data";

import { FollowButton } from "@/components/follow-button";

export function FeedMediaViewer({
  post,
  priorityMedia = false,
}: {
  post: DisplayPost;
  priorityMedia?: boolean;
}) {
  let parsedMediaUrls: string[] | undefined = undefined;
  let singleMediaUrl: string | null | undefined = post.mediaUrl;

  if (post.mediaType === "carousel" && post.mediaUrl) {
    try {
      parsedMediaUrls = JSON.parse(post.mediaUrl);
      singleMediaUrl = undefined;
    } catch {
      console.warn("Failed to parse carousel mediaUrl", post.mediaUrl);
    }
  }

  if (post.isFollowersOnlyLocked) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900/10 backdrop-blur-3xl p-6 text-center shadow-inner">
        <div className="flex size-16 items-center justify-center rounded-full bg-white/20 text-3xl shadow-sm backdrop-blur-md">
          🔒
        </div>
        <p className="mt-4 text-sm font-black text-slate-800 drop-shadow-sm">
          {post.teaserText ? post.teaserText : "Sadece Takipçilere Özel"}
        </p>
        <p className="mt-2 text-xs font-bold text-slate-600 max-w-[250px] leading-relaxed drop-shadow-sm">
          Bu içeriği görmek için {post.authorName || "bu hocayı"} takip edin.
        </p>
        {post.authorId && (
          <div className="mt-5 w-40">
            <FollowButton followingId={post.authorId} sourcePostId={post.postId} />
          </div>
        )}
      </div>
    );
  }

  return (
    <DoubleTapLikeLink
      className="flex h-full w-full items-center justify-center"
      href={post.postId ? `/post/${post.postId}` : "/micro"}
      initialLiked={post.isLiked}
      postId={post.postId}
    >
      <SocialMediaFrame
        alt={post.caption.slice(0, 80)}
        className="zigo-media h-full w-full"
        gradient={post.gradient}
        mediaType={post.mediaType}
        mediaUrl={singleMediaUrl}
        mediaUrls={parsedMediaUrls}
        priority={priorityMedia}
        scene={post.scene}
        objectFit="cover"
      />
    </DoubleTapLikeLink>
  );
}
