"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import React, { useRef,useState } from "react";

import { SocialMediaScene, type SocialMediaSceneName } from "@/components/social-media-scenes";
import { getMediaPlaybackUrl } from "@/lib/domain/video-delivery";

export type MediaFilterPreset = "normal" | "vivid" | "contrast" | "warm" | "bw";

type SocialMediaFrameProps = {
  mediaUrl?: string | null;
  mediaUrls?: string[] | null;
  mediaType?: string | null;
  gradient?: string;
  className?: string;
  children?: ReactNode;
  controls?: boolean;
  scene?: SocialMediaSceneName;
  alt?: string;
  priority?: boolean;
  objectFit?: "contain" | "cover" | "fill";
  scale?: number;
  filterPreset?: MediaFilterPreset;
};

const filterCssMap: Record<MediaFilterPreset, string> = {
  normal: "none",
  vivid: "saturate(1.4) contrast(1.1)",
  contrast: "contrast(1.25) brightness(1.05)",
  warm: "sepia(0.25) saturate(1.2) contrast(1.05)",
  bw: "grayscale(1)",
};

export function SocialMediaFrame({
  mediaUrl,
  mediaUrls,
  mediaType,
  gradient = "from-crystal via-fuchsia-500 to-rose-400",
  className = "zigo-media",
  children,
  controls = false,
  scene = "math",
  alt = "",
  priority = false,
  objectFit = "contain",
  scale = 1,
  filterPreset = "normal",
}: SocialMediaFrameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Consolidate single url or array into items array
  const rawUrls = mediaUrls && mediaUrls.length > 0 ? mediaUrls : mediaUrl ? [mediaUrl] : [];
  const items = rawUrls.map((url) => getMediaPlaybackUrl(url)).filter(Boolean) as string[];
  const isCarousel = items.length > 1;
  const hasMedia = items.length > 0;
  const isVideo = Boolean(hasMedia && mediaType === "video");

  React.useEffect(() => {
    if (!isVideo || !videoRef.current) return;

    const video = videoRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (entry.intersectionRatio >= 0.5) {
              video.play().catch(() => {});
            }
          } else {
            video.pause();
          }
        }
      },
      {
        threshold: [0.1, 0.5, 0.8],
      }
    );

    observer.observe(video);

    return () => {
      observer.unobserve(video);
    };
  }, [isVideo]);

  const fitClass =
    objectFit === "cover" ? "object-cover" : objectFit === "fill" ? "object-fill" : "object-contain";
  const filterCss = filterCssMap[filterPreset] ?? "none";
  const combinedStyle = {
    transform: scale && scale !== 1 ? `scale(${scale})` : undefined,
    filter: filterCss !== "none" ? filterCss : undefined,
  };

  function handleScroll() {
    if (!containerRef.current) return;
    const { scrollLeft, clientWidth } = containerRef.current;
    if (clientWidth > 0) {
      const idx = Math.round(scrollLeft / clientWidth);
      if (idx !== currentIndex && idx >= 0 && idx < items.length) {
        setCurrentIndex(idx);
      }
    }
  }

  return (
    <div
      className={`relative overflow-hidden ${hasMedia ? "bg-night" : `bg-gradient-to-br ${gradient}`} ${className}`}
    >
      {!hasMedia ? (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.2),transparent_15rem)]" />
      ) : null}

      {isCarousel ? (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="no-scrollbar flex size-full snap-x snap-mandatory overflow-x-auto"
        >
          {items.map((url, idx) => (
            <div key={url + idx} className="group relative size-full flex-none snap-center">
              {isVideo ? (
                <>
                  <video
                    aria-label={alt || `Video ${idx + 1}`}
                    className={`size-full transition-all duration-200 ${fitClass}`}
                    controls={controls}
                    loop={!controls}
                    muted={!controls}
                    onClick={(e) => {
                      e.stopPropagation();
                      const video = e.currentTarget;
                      if (video.paused) {
                        video.play().catch(() => {});
                      } else {
                        video.pause();
                      }
                    }}
                    playsInline
                    preload={controls ? "metadata" : "none"}
                    src={url}
                    style={combinedStyle}
                  />
                  <button
                    aria-label="Tam Ekran"
                    className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-md transition-opacity hover:bg-black/70 group-hover:opacity-100"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const v = e.currentTarget.parentElement?.querySelector("video");
                      if (v) {
                        if (v.requestFullscreen) v.requestFullscreen().catch(() => {});
                        else if ((v as any).webkitRequestFullscreen) (v as any).webkitRequestFullscreen();
                      }
                    }}
                    type="button"
                  >
                    <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                </>
              ) : (
                <Image
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  alt={alt ? `${alt} (${idx + 1}/${items.length})` : "Media"}
                  className={`transition-all duration-200 ${fitClass}`}
                  priority={priority && idx === 0}
                  src={url}
                  style={combinedStyle}
                />
              )}
            </div>
          ))}
        </div>
      ) : hasMedia ? (
        isVideo ? (
          <div className="group relative h-auto w-full">
            <video
              ref={videoRef}
              aria-label={alt || "Video preview"}
              className={`h-auto w-full max-h-[75vh] transition-all duration-200 ${fitClass}`}
              controls={controls}
              loop={!controls}
              muted={!controls}
              onClick={(e) => {
                e.stopPropagation();
                const video = e.currentTarget;
                if (video.paused) {
                  video.play().catch(() => {});
                } else {
                  video.pause();
                }
              }}
              playsInline
              preload={controls ? "metadata" : "none"}
              src={items[0]}
              style={combinedStyle}
            />
            <button
              aria-label="Tam Ekran"
              className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-md transition-opacity hover:bg-black/70 group-hover:opacity-100"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const v = videoRef.current;
                if (v) {
                  if (v.requestFullscreen) v.requestFullscreen().catch(() => {});
                  else if ((v as any).webkitRequestFullscreen) (v as any).webkitRequestFullscreen();
                }
              }}
              type="button"
            >
              <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        ) : (
          <Image
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            alt={alt || "Media"}
            className={`transition-all duration-200 ${fitClass}`}
            priority={priority}
            src={items[0]}
            style={combinedStyle}
          />
        )
      ) : null}

      {!hasMedia ? <SocialMediaScene scene={scene} /> : null}

      {hasMedia ? (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/24 via-transparent to-black/5" />
      ) : null}

      {/* Carousel dots & badge indicator */}
      {isCarousel ? (
        <>
          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[0.62rem] font-black text-white backdrop-blur">
            {currentIndex + 1}/{items.length}
          </span>
          <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1">
            {items.map((_, idx) => (
              <span
                key={idx}
                className={`size-1.5 rounded-full transition-all ${
                  idx === currentIndex ? "w-4 bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}

      {children ? (
        <div className="zigo-media-overlay pointer-events-none relative z-[1] flex size-full flex-col justify-between p-4 text-white">
          {children}
        </div>
      ) : null}
    </div>
  );
}

