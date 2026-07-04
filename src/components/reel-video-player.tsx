"use client";

import { useEffect, useRef } from "react";

import { getMediaPlaybackUrl } from "@/lib/domain/video-delivery";
type ReelVideoPlayerProps = {
  mediaUrl: string;
  reelId: string;
};

export function ReelVideoPlayer({ mediaUrl, reelId }: ReelVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackUrl = getMediaPlaybackUrl(mediaUrl);

  function emitPlayback(isPlaying: boolean) {
    window.dispatchEvent(new CustomEvent("zigo:reel-playback", {
      detail: { isPlaying, reelId },
    }));
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void video.play().catch(() => undefined);
          return;
        }

        video.pause();
      },
      { threshold: 0.65 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [playbackUrl, reelId]);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 size-full object-cover"
      autoPlay
      loop
      muted
      onEnded={() => emitPlayback(false)}
      onPause={() => emitPlayback(false)}
      onPlay={() => emitPlayback(true)}
      onPlaying={() => emitPlayback(true)}
      playsInline
      preload="metadata"
      src={playbackUrl}
    />
  );
}
