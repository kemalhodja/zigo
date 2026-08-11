"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getMediaPlaybackUrl } from "@/lib/domain/video-delivery";

type ReelVideoPlayerProps = {
  mediaUrl: string;
  reelId: string;
};

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function ReelVideoPlayer({ mediaUrl, reelId }: ReelVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const playbackUrl = getMediaPlaybackUrl(mediaUrl);

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  function emitPlayback(isPlaying: boolean) {
    window.dispatchEvent(
      new CustomEvent("zigo:reel-playback", {
        detail: { isPlaying, reelId },
      }),
    );
  }

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setShowControls(true);
    hideTimerRef.current = setTimeout(() => {
      if (!isSeeking) setShowControls(false);
    }, 3000);
  }, [isSeeking]);

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

  useEffect(() => {
    scheduleHide();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [scheduleHide]);

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video || isSeeking) return;
    setCurrentTime(video.currentTime);
    setProgress(video.duration > 0 ? (video.currentTime / video.duration) * 100 : 0);
  }

  function handleLoadedMetadata() {
    const video = videoRef.current;
    if (video) setDuration(video.duration);
  }

  function seekTo(clientX: number) {
    const bar = progressBarRef.current;
    const video = videoRef.current;
    if (!bar || !video || !video.duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    video.currentTime = ratio * video.duration;
    setProgress(ratio * 100);
    setCurrentTime(video.currentTime);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsSeeking(true);
    setShowControls(true);
    seekTo(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isSeeking) return;
    seekTo(e.clientX);
  }

  function handlePointerUp() {
    setIsSeeking(false);
    scheduleHide();
  }

  function togglePlayPause() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
    scheduleHide();
  }

  function handleTap() {
    togglePlayPause();
  }

  const [isMuted, setIsMuted] = useState(true);

  function toggleMute(e: React.MouseEvent) {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }

  return (
    <div className="absolute inset-0 size-full">
      <video
        ref={videoRef}
        autoPlay
        className="absolute inset-0 size-full object-cover"
        loop
        muted={isMuted}
        onClick={handleTap}
        onEnded={() => emitPlayback(false)}
        onLoadedMetadata={handleLoadedMetadata}
        onPause={() => {
          emitPlayback(false);
          setIsPaused(true);
        }}
        onPlay={() => {
          emitPlayback(true);
          setIsPaused(false);
        }}
        onPlaying={() => {
          emitPlayback(true);
          setIsPaused(false);
        }}
        onTimeUpdate={handleTimeUpdate}
        playsInline
        preload="metadata"
        src={playbackUrl}
      />

      {/* Top right mute/unmute button */}
      <button
        aria-label={isMuted ? "Sesi Aç" : "Sesi Kapat"}
        className="tap-scale absolute right-4 top-4 z-30 flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
        onClick={toggleMute}
        type="button"
      >
        {isMuted ? (
          <svg aria-hidden="true" className="size-4 fill-white" viewBox="0 0 24 24">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
          </svg>
        ) : (
          <svg aria-hidden="true" className="size-4 fill-white" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        )}
      </button>

      {isPaused ? (
        <button
          aria-label="Oynat"
          className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 p-4 backdrop-blur-sm transition-opacity duration-200"
          onClick={togglePlayPause}
          type="button"
        >
          <svg aria-hidden="true" className="ml-1 size-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      ) : null}

      <div
        className="absolute inset-x-0 bottom-0 z-20 transition-opacity duration-300"
        style={{ opacity: showControls || isSeeking ? 1 : 0 }}
      >
        <div className="flex items-center gap-2 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+6.5rem)]">
          <span className="min-w-[2.2rem] text-right text-[0.6rem] font-bold tabular-nums text-white/80">
            {formatTime(currentTime)}
          </span>

          <div
            ref={progressBarRef}
            className="group relative flex h-6 flex-1 cursor-pointer items-center touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            role="slider"
            aria-label="Video ilerleme çubuğu"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <div className="absolute inset-x-0 h-[3px] rounded-full bg-white/25 transition-[height] duration-150 group-hover:h-[5px]">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-white via-[#a8edea] to-[#fed6e3]"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div
              className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)] transition-transform duration-150 group-hover:scale-125"
              style={{ left: `${progress}%` }}
            />
          </div>

          <span className="min-w-[2.2rem] text-[0.6rem] font-bold tabular-nums text-white/80">
            {duration > 0 ? `-${formatTime(duration - currentTime)}` : "0:00"}
          </span>
        </div>
      </div>
    </div>
  );
}
