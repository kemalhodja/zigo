"use client";

import { ExternalLinkIcon, LockIcon, RotateCcwIcon } from "lucide-react";
import React, { useState } from "react";

import { SharedLinkPaywallModal } from "@/components/shared-link-paywall-modal";
import { classifyExternalLink } from "@/lib/domain/social/link-helper";
import { useSubscriptionStatus } from "@/lib/hooks/use-subscription-status";

type PromoVideoEndCardProps = {
  externalUrl: string;
  canOpenLink?: boolean;
  onReplay: () => void;
};

/**
 * Frosted-glass End-Card displayed when a 30s short promo video finishes
 * on a post that also links to a full lesson on YouTube, Vimeo, etc.
 * Enforces the Zigo Plus Shared Link Gate on unsubscribed viewers.
 */
export function PromoVideoEndCard({
  externalUrl,
  canOpenLink,
  onReplay,
}: PromoVideoEndCardProps) {
  const [showPaywall, setShowPaywall] = useState(false);
  const { isSubscriber } = useSubscriptionStatus();
  const allowed = typeof canOpenLink === "boolean" ? canOpenLink : isSubscriber;
  const parsed = classifyExternalLink(externalUrl);

  if (!parsed) return null;

  const platformName = parsed.platformName || parsed.displayDomain;
  const badgePrefix =
    parsed.type === "youtube"
      ? "🔴"
      : parsed.type === "video"
        ? "🎬"
        : parsed.type === "instagram"
          ? "📸"
          : "🔗";

  return (
    <>
      <div
        className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/80 p-5 text-center text-white backdrop-blur-md animate-in fade-in duration-300"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-black tracking-wide text-white/95">
          <span>{badgePrefix}</span>
          <span>{parsed.label}</span>
        </span>

        <h3 className="mt-3 max-w-xs text-base font-black leading-snug text-white">
          Tanıtım bitti — Tam dersi izlemeye hazır mısın?
        </h3>

        <p className="mt-1.5 max-w-xs text-xs font-semibold leading-relaxed text-white/75">
          {allowed
            ? `${platformName} bağlantısını açarak dersin tamamını kesintisiz izleyebilirsin.`
            : `Uzun ders videoları ve ${parsed.displayDomain} bağlantıları Zigo Plus abonelerine özeldir.`}
        </p>

        <div className="mt-4 flex w-full max-w-[240px] flex-col gap-2">
          {allowed ? (
            <a
              href={parsed.cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="tap-scale flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-violet-600/35 transition hover:brightness-110"
            >
              <span>Tam Dersi İzle ({platformName})</span>
              <ExternalLinkIcon className="size-3.5" />
            </a>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowPaywall(true);
              }}
              className="tap-scale flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-fuchsia-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/30 transition hover:brightness-110"
            >
              <LockIcon className="size-3.5" />
              <span>Zigo Plus ile Tam Dersi Aç</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onReplay();
            }}
            className="tap-scale flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white/90 transition hover:bg-white/20"
          >
            <RotateCcwIcon className="size-3.5" />
            <span>Tanıtımı Tekrar İzle</span>
          </button>
        </div>
      </div>

      <SharedLinkPaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        targetDomain={parsed.displayDomain}
        url={parsed.cleanUrl}
      />
    </>
  );
}
