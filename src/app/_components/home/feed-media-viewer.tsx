import { DoubleTapLikeLink } from "@/components/double-tap-like-link";
import { SocialMediaFrame } from "@/components/social-media-frame";

import type { DisplayPost } from "./data";

export function FeedMediaViewer({
  post,
  priorityMedia = false,
  isMicro = false,
  oneMinLessonLabel,
}: {
  post: DisplayPost;
  priorityMedia?: boolean;
  isMicro?: boolean;
  oneMinLessonLabel: string;
}) {
  return (
    <DoubleTapLikeLink
      href={post.postId ? `/post/${post.postId}` : "/micro"}
      initialLiked={post.isLiked}
      postId={post.postId}
    >
      <SocialMediaFrame
        alt={post.caption.slice(0, 80)}
        className="zigo-media h-full w-full"
        gradient={post.gradient}
        mediaType={post.mediaType}
        mediaUrl={post.mediaUrl}
        priority={priorityMedia}
        scene={post.scene}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="zigo-meta-badge rounded-full bg-black/30 px-2.5 py-1 text-white backdrop-blur-md">
            {isMicro ? oneMinLessonLabel : post.area}
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
  );
}
