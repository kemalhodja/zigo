import { DoubleTapLikeLink } from "@/components/double-tap-like-link";
import { SocialMediaFrame } from "@/components/social-media-frame";

import type { DisplayPost } from "./data";

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
