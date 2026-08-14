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
        mediaUrl={post.mediaUrl}
        priority={priorityMedia}
        scene={post.scene}
      />
    </DoubleTapLikeLink>
  );
}
