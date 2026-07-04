"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { SocialMediaScene, type SocialMediaSceneName } from "@/components/social-media-scenes";
import { VerifiedBadge } from "@/components/social-primitives";
import { StoryReplyForm } from "@/components/story-reply-form";
import { getMediaPlaybackUrl } from "@/lib/domain/video-delivery";
import { useMessages } from "@/lib/i18n/locale-context";

export type StoryViewerItem = {
  id: string;
  creatorId: string | null;
  creator: string;
  caption: string;
  color: string;
  mediaUrl: string | null;
  scene?: SocialMediaSceneName;
  verified: boolean;
  isVideo: boolean;
};

type StoryViewerProps = {
  stories: StoryViewerItem[];
};

const storyDurationMs = 6500;
const tickMs = 120;

export function StoryViewer({ stories }: StoryViewerProps) {
  const m = useMessages();
  const sv = m.sparkViewer;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const story = stories[activeIndex];
  const storyMediaUrl = story?.mediaUrl ? getMediaPlaybackUrl(story.mediaUrl) : null;

  useEffect(() => {
    if (stories.length === 0) {
      setProgress(0);
      return;
    }

    if (activeIndex > stories.length - 1) {
      setActiveIndex(0);
      return;
    }

    setProgress(0);
    setIsPaused(false);
  }, [activeIndex, stories.length]);

  useEffect(() => {
    if (stories.length === 0 || isPaused) return;

    const interval = window.setInterval(() => {
      setProgress((current) => {
        const next = current + (tickMs / storyDurationMs) * 100;
        if (next >= 100) {
          window.clearInterval(interval);
          setActiveIndex((index) => Math.min(index + 1, stories.length - 1));
          return 100;
        }

        return next;
      });
    }, tickMs);

    return () => window.clearInterval(interval);
  }, [isPaused, stories.length]);

  useEffect(() => {
    function handleVisibilityChange() {
      setIsPaused(document.hidden);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPaused) {
      video.pause();
      return;
    }

    void video.play().catch(() => undefined);
  }, [activeIndex, isPaused]);

  if (!story) {
    return (
      <div className="safe-screen flex flex-col items-center justify-center bg-night p-8 text-center text-white">
        <span className="flex size-20 items-center justify-center rounded-lg border-2 border-white/90">
          <svg aria-hidden="true" className="size-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect height="16" rx="4" width="18" x="3" y="4" />
            <path d="M8 4l3 5" />
            <path d="M14 4l3 5" />
          </svg>
        </span>
        <h1 className="mt-6 text-2xl font-black">{sv.noActiveSparks}</h1>
        <p className="mt-3 max-w-xs text-sm font-semibold leading-6 text-white/65">
          {sv.noActiveSparksDesc}
        </p>
        <Link className="tap-scale mt-6 rounded-lg bg-white px-5 py-3 text-sm font-black text-night" href="/">
          {sv.backToFeed}
        </Link>
      </div>
    );
  }

  function previousStory() {
    setProgress(0);
    setActiveIndex((index) => Math.max(index - 1, 0));
  }

  function nextStory() {
    setProgress(0);
    setActiveIndex((index) => Math.min(index + 1, stories.length - 1));
  }

  return (
    <div
      className={`safe-screen bg-gradient-to-br ${story.color}`}
      onPointerCancel={() => setIsPaused(false)}
      onPointerDown={() => setIsPaused(true)}
      onPointerLeave={() => setIsPaused(false)}
      onPointerUp={() => setIsPaused(false)}
    >
      <section className="safe-bottom safe-top relative flex min-h-dvh flex-col justify-between overflow-hidden px-4 pb-5 pt-4 text-white">
        {storyMediaUrl && story.isVideo ? (
          <video ref={videoRef} className="absolute inset-0 size-full object-cover" autoPlay loop muted playsInline preload="metadata" src={storyMediaUrl} />
        ) : null}
        {storyMediaUrl && !story.isVideo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={`${story.creator} Spark media`} className="absolute inset-0 size-full object-cover" src={storyMediaUrl} />
        ) : null}
        {!storyMediaUrl ? <SocialMediaScene scene={story.scene ?? "math"} /> : null}
        {!storyMediaUrl ? <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.24),transparent_18rem)]" /> : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/72 via-black/8 to-black/78" />

        <div className="relative space-y-3">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${stories.length}, 1fr)` }}>
            {stories.map((item, index) => (
              <span className="h-1 overflow-hidden rounded-full bg-white/30" key={item.id}>
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-white via-mint to-aqua transition-all"
                  style={{
                    width:
                      index < activeIndex
                        ? "100%"
                        : index === activeIndex
                          ? `${progress}%`
                          : "0%",
                  }}
                />
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full border border-white/50 bg-black/18 text-sm font-black text-white backdrop-blur">
                {story.creator.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-black">@{story.creator}</p>
                  {story.verified ? <VerifiedBadge className="size-4" /> : null}
                  <span className="text-xs font-black text-white/70">now</span>
                </div>
                <p className="text-xs font-bold text-white/70">
                  {m.zigo.spark} <span className="sr-only">{sv.verifiedStorySr}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-white/16 px-2.5 py-1 text-[0.62rem] font-black text-white backdrop-blur">
                {activeIndex + 1}/{stories.length}
              </span>
              <Link aria-label={sv.closeSparks} className="tap-scale flex size-9 items-center justify-center text-white" href="/">
                <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 6l12 12" />
                  <path d="M18 6 6 18" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute inset-y-20 left-0 right-0 grid grid-cols-2">
          <button
            aria-label={sv.previousSpark}
            className="group flex h-full cursor-default items-center justify-start pl-3"
            disabled={activeIndex === 0}
            onClick={previousStory}
            type="button"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-black/18 opacity-70 backdrop-blur transition group-hover:opacity-100 group-disabled:hidden">
              <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </span>
          </button>
          <button
            aria-label={sv.nextSpark}
            className="group flex h-full cursor-default items-center justify-end pr-3"
            disabled={activeIndex === stories.length - 1}
            onClick={nextStory}
            type="button"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-black/18 opacity-70 backdrop-blur transition group-hover:opacity-100 group-disabled:hidden">
              <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
          </button>
        </div>

        <div className="relative space-y-4">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="sr-only">
                Match-Feed
              </span>
              <span className="sr-only">
                Safe replies
              </span>
              <span className="rounded-lg bg-white/16 px-3 py-1.5 text-[0.68rem] font-black text-white backdrop-blur">
                Hold to pause
              </span>
            </div>
            <h2 className="max-w-[18rem] text-xl font-black leading-tight">{story.caption}</h2>
          </div>
          <StoryReplyForm storyId={story.id} />
        </div>
      </section>
    </div>
  );
}
