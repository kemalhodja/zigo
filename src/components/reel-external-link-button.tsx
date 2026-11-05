"use client";

import React, { useState } from "react";

import { SharedLinkPaywallModal } from "@/components/shared-link-paywall-modal";
import type { ParsedExternalLink } from "@/lib/domain/social/link-helper";
import { useSubscriptionStatus } from "@/lib/hooks/use-subscription-status";

type ReelExternalLinkButtonProps = {
  parsedLink: ParsedExternalLink;
  canOpenLink?: boolean;
};

export function ReelExternalLinkButton({
  parsedLink,
  canOpenLink,
}: ReelExternalLinkButtonProps) {
  const [showPaywall, setShowPaywall] = useState(false);
  const { isSubscriber } = useSubscriptionStatus();

  const allowed = typeof canOpenLink === "boolean" ? canOpenLink : isSubscriber;

  const handleClick = (e: React.MouseEvent) => {
    if (!allowed) {
      e.preventDefault();
      e.stopPropagation();
      setShowPaywall(true);
    }
  };

  const label =
    parsedLink.type === "youtube"
      ? "🔴 YouTube"
      : parsedLink.type === "instagram"
      ? "📸 Instagram"
      : "🌐 Bağlantı";

  return (
    <>
      <a
        href={allowed ? parsedLink.cleanUrl : "#"}
        onClick={handleClick}
        target={allowed ? "_blank" : undefined}
        rel={allowed ? "noopener noreferrer" : undefined}
        className={`tap-scale inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-black shadow-md backdrop-blur transition hover:scale-105 active:scale-95 ${
          !allowed
            ? "bg-black/60 text-amber-300 border border-amber-400/40"
            : parsedLink.type === "youtube"
            ? "bg-red-600 text-white"
            : parsedLink.type === "instagram"
            ? "bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white"
            : "bg-white text-slate-900"
        }`}
      >
        <span>{label}</span>
        <span className="text-[10px]">{allowed ? "↗" : "🔒"}</span>
      </a>

      <SharedLinkPaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        targetDomain={parsedLink.displayDomain}
        url={parsedLink.cleanUrl}
      />
    </>
  );
}
