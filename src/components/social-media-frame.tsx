import type { ReactNode } from "react";

import { SocialMediaScene, type SocialMediaSceneName } from "@/components/social-media-scenes";
import { getMediaPlaybackUrl } from "@/lib/domain/video-delivery";
type SocialMediaFrameProps = {
  mediaUrl?: string | null;
  mediaType?: string | null;
  gradient?: string;
  className?: string;
  children?: ReactNode;
  controls?: boolean;
  scene?: SocialMediaSceneName;
  alt?: string;
  priority?: boolean;
};

export function SocialMediaFrame({
  mediaUrl,
  mediaType,
  gradient = "from-crystal via-fuchsia-500 to-rose-400",
  className = "zigo-media",
  children,
  controls = false,
  scene = "math",
  alt = "",
  priority = false,
}: SocialMediaFrameProps) {
  const playbackUrl = mediaUrl ? getMediaPlaybackUrl(mediaUrl) : undefined;
  const hasMedia = Boolean(playbackUrl);
  const isVideo = Boolean(playbackUrl && mediaType === "video");
  const isImage = Boolean(playbackUrl && mediaType === "image");

  return (
    <div
      className={`relative overflow-hidden ${hasMedia ? "bg-night" : `bg-gradient-to-br ${gradient}`} ${className}`}
    >
      {!hasMedia ? <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.2),transparent_15rem)]" /> : null}
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={alt}
          className="absolute inset-0 size-full object-cover"
          decoding="async"
          fetchPriority={priority ? "high" : "low"}
          loading={priority ? "eager" : "lazy"}
          src={playbackUrl}
        />
      ) : null}
      {isVideo ? (
        <video
          aria-label={alt || "Video preview"}
          className="absolute inset-0 size-full object-cover"
          controls={controls}
          loop={!controls}
          muted={!controls}
          playsInline
          preload={controls ? "metadata" : "none"}
          src={playbackUrl}
        />
      ) : null}
      {!hasMedia ? <SocialMediaScene scene={scene} /> : null}
      {hasMedia ? <div className="absolute inset-0 bg-gradient-to-t from-black/24 via-transparent to-black/5" /> : null}
      {!hasMedia ? <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-transparent" /> : null}
      {children ? <div className="zigo-media-overlay relative z-[1] flex size-full flex-col justify-between p-4 text-white">{children}</div> : null}
    </div>
  );
}
