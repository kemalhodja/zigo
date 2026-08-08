"use client";

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

  // Consolidate single url or array into items array
  const rawUrls = mediaUrls && mediaUrls.length > 0 ? mediaUrls : mediaUrl ? [mediaUrl] : [];
  const items = rawUrls.map((url) => getMediaPlaybackUrl(url)).filter(Boolean) as string[];
  const isCarousel = items.length > 1;
  const hasMedia = items.length > 0;
  const isVideo = Boolean(hasMedia && mediaType === "video");

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
            <div key={url + idx} className="relative size-full flex-none snap-center">
              {isVideo ? (
                <video
                  aria-label={alt || `Video ${idx + 1}`}
                  className={`size-full transition-all duration-200 ${fitClass}`}
                  controls={controls}
                  loop={!controls}
                  muted={!controls}
                  onClick={controls ? (e: React.MouseEvent) => e.stopPropagation() : undefined}
                  playsInline
                  preload={controls ? "metadata" : "none"}
                  src={url}
                  style={combinedStyle}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={alt ? `${alt} (${idx + 1}/${items.length})` : ""}
                  className={`size-full transition-all duration-200 ${fitClass}`}
                  decoding="async"
                  fetchPriority={priority && idx === 0 ? "high" : "low"}
                  loading={priority && idx === 0 ? "eager" : "lazy"}
                  src={url}
                  style={combinedStyle}
                />
              )}
            </div>
          ))}
        </div>
      ) : hasMedia ? (
        isVideo ? (
          <div className="relative size-full">
            <video
              aria-label={alt || "Video preview"}
              className={`absolute inset-0 size-full transition-all duration-200 ${fitClass}`}
              controls={controls}
              loop={!controls}
              muted={!controls}
              onClick={controls ? (e: React.MouseEvent) => e.stopPropagation() : undefined}
              playsInline
              preload={controls ? "metadata" : "none"}
              src={items[0]}
              style={combinedStyle}
            />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={alt}
            className={`absolute inset-0 size-full transition-all duration-200 ${fitClass}`}
            decoding="async"
            fetchPriority={priority ? "high" : "low"}
            loading={priority ? "eager" : "lazy"}
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

