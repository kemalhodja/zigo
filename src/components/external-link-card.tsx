"use client";

import { ExternalLinkIcon, GlobeIcon, PlayIcon } from "lucide-react";
import { useState } from "react";

import { classifyExternalLink } from "@/lib/domain/social/link-helper";

interface ExternalLinkCardProps {
  url?: string | null;
  sponsoredLabel?: string | null;
  isSponsored?: boolean;
  className?: string;
  allowInlineEmbed?: boolean;
}

export function ExternalLinkCard({
  url,
  sponsoredLabel,
  isSponsored = false,
  className = "",
  allowInlineEmbed = true,
}: ExternalLinkCardProps) {
  const [showEmbed, setShowEmbed] = useState(false);
  const parsed = classifyExternalLink(url);

  if (!parsed) return null;

  // ── YouTube Presentation ──────────────────────────────────────────────────
  if (parsed.type === "youtube") {
    return (
      <div className={`overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-red-50/60 via-white to-rose-50/40 shadow-xs ${className}`}>
        {allowInlineEmbed && showEmbed && parsed.youtubeEmbedUrl ? (
          <div className="relative aspect-video w-full bg-black">
            <iframe
              src={parsed.youtubeEmbedUrl}
              title={parsed.label}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          </div>
        ) : (
          <div>
            {parsed.youtubeThumbnailUrl ? (
              <div 
                onClick={() => setShowEmbed(true)}
                className="group relative aspect-video w-full cursor-pointer overflow-hidden bg-slate-900"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={parsed.youtubeThumbnailUrl}
                  alt={parsed.label}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-red-600 text-white shadow-xl shadow-red-600/40 transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
                    <PlayIcon className="ml-1 size-7 fill-white text-white" />
                  </div>
                </div>
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                  <span className="flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-black backdrop-blur-md">
                    🔴 {parsed.label}
                  </span>
                  <span className="text-[11px] font-bold text-white/80">Oynatmak için dokunun</span>
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3 p-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm shadow-red-500/30">
                  <svg className="size-5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <div className="flex flex-col truncate">
                  <span className="truncate text-sm font-black text-slate-900">
                    {sponsoredLabel || parsed.label}
                  </span>
                  <span className="truncate text-xs font-semibold text-red-600">
                    youtube.com
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={parsed.cleanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-700 shadow-xs transition-colors hover:bg-red-50 active:scale-95"
                >
                  <span>YouTube'da Aç</span>
                  <ExternalLinkIcon className="size-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Instagram Presentation ────────────────────────────────────────────────
  if (parsed.type === "instagram") {
    return (
      <a
        href={parsed.cleanUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`group flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-r from-pink-50/70 via-purple-50/40 to-amber-50/30 p-3.5 shadow-xs transition-all hover:border-pink-300 hover:shadow-sm active:scale-[0.99] ${className}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-md shadow-pink-500/25">
            <svg className="size-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
          <div className="flex flex-col truncate">
            <span className="truncate text-sm font-black text-slate-900 group-hover:text-pink-600 transition-colors">
              {sponsoredLabel || (parsed.isInstagramReel ? "Instagram Reels Videosu" : "Instagram Gönderisi")}
            </span>
            <span className="truncate text-xs font-semibold text-slate-500">
              instagram.com · Görüntülemek için dokunun
            </span>
          </div>
        </div>

        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-pink-600 shadow-xs border border-pink-100 group-hover:bg-pink-50 transition-colors">
          <ExternalLinkIcon className="size-4" />
        </div>
      </a>
    );
  }

  // ── General Website / Education Portal Presentation ───────────────────────
  return (
    <WebLinkCard
      cleanUrl={parsed.cleanUrl}
      displayDomain={parsed.displayDomain}
      isSponsored={isSponsored}
      sponsoredLabel={sponsoredLabel}
      className={className}
    />
  );
}

function WebLinkCard({
  cleanUrl,
  displayDomain,
  isSponsored,
  sponsoredLabel,
  className,
}: {
  cleanUrl: string;
  displayDomain: string;
  isSponsored: boolean;
  sponsoredLabel?: string | null;
  className: string;
}) {
  const [meta, setMeta] = useState<{
    title: string | null;
    description: string | null;
    image: string | null;
    siteName: string | null;
    favicon: string | null;
  } | null>(null);

  useState(() => {
    // Only attempt preview for HTTP/HTTPS web links
    if (cleanUrl.startsWith("http")) {
      fetch(`/api/social/link-preview?url=${encodeURIComponent(cleanUrl)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && (data.title || data.description || data.image)) {
            setMeta(data);
          }
        })
        .catch(() => null);
    }
  });

  return (
    <a
      href={cleanUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex flex-col overflow-hidden rounded-2xl border transition-all active:scale-[0.99] ${
        isSponsored
          ? "border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 hover:border-amber-400 hover:shadow-sm"
          : "border-slate-200 bg-slate-50/80 hover:bg-slate-100/80 hover:border-slate-300"
      } ${className}`}
    >
      {meta?.image && (
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-slate-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={meta.image}
            alt={meta.title || displayDomain}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-3 p-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl shadow-xs overflow-hidden ${
            isSponsored 
              ? "bg-amber-500 text-white shadow-amber-500/20" 
              : "bg-white text-indigo-600 border border-slate-200"
          }`}>
            {meta?.favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={meta.favicon} alt={displayDomain} className="size-6 object-contain" />
            ) : (
              <GlobeIcon className="size-5" />
            )}
          </div>
          <div className="flex flex-col truncate">
            <span className={`truncate text-sm font-black ${
              isSponsored ? "text-amber-950" : "text-slate-900 group-hover:text-indigo-600 transition-colors"
            }`}>
              {sponsoredLabel || meta?.title || "Bağlantıyı Ziyaret Et"}
            </span>
            <span className="truncate text-xs font-semibold text-slate-500">
              {meta?.siteName || displayDomain}
              {meta?.description ? ` · ${meta.description}` : ""}
            </span>
          </div>
        </div>

        <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl shadow-xs border transition-colors ${
          isSponsored 
            ? "bg-amber-500 text-white border-amber-400" 
            : "bg-white text-slate-600 border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-600"
        }`}>
          <ExternalLinkIcon className="size-4" />
        </div>
      </div>
    </a>
  );
}

