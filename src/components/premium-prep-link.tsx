"use client";

import { useState } from "react";

import { ZigoPlusUpsell } from "@/components/zigo-plus-upsell";

type PremiumPrepLinkProps = {
  postId: string;
  label: string;
  canOpen: boolean;
  showForLearners?: boolean;
  allowDevActivate?: boolean;
  isPremium?: boolean;
};

export function PremiumPrepLink({
  postId,
  label,
  canOpen,
  showForLearners = true,
  allowDevActivate = false,
  isPremium = false,
}: PremiumPrepLinkProps) {
  const [loading, setLoading] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [message, setMessage] = useState("");

  if (!showForLearners || !label.trim()) return null;

  async function handleOpen() {
    if (canOpen) {
      setLoading(true);
      setMessage("");
      try {
        const response = await fetch(`/api/social/posts/${postId}/premium-prep`);
        const payload = (await response.json().catch(() => null)) as {
          data?: { url?: string };
          error?: string;
          code?: string;
        } | null;

        if (response.status === 402 || payload?.code === "SUBSCRIPTION_REQUIRED") {
          setShowUpsell(true);
          setMessage("Bu kaynak Zigo Plus aboneliği ile açılır.");
          setLoading(false);
          return;
        }

        if (!response.ok || !payload?.data?.url) {
          setMessage(payload?.error ?? "Kaynak açılamadı.");
          setLoading(false);
          return;
        }

        window.open(payload.data.url, "_blank", "noopener,noreferrer");
        setLoading(false);
        return;
      } catch {
        setMessage("Bağlantı hatası. Tekrar deneyin.");
        setLoading(false);
        return;
      }
    }

    setShowUpsell(true);
    setMessage("Yazılı hazırlık kaynaklarına erişmek için Zigo Plus'a abone olun.");
  }

  return (
    <div className="space-y-2">
      <button
        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm font-bold transition ${
          canOpen
            ? "border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100"
            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
        } disabled:opacity-60`}
        disabled={loading}
        onClick={() => void handleOpen()}
        type="button"
      >
        <span
          aria-hidden="true"
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
            canOpen ? "bg-amber-400 text-night" : "bg-slate-200 text-slate-600"
          }`}
        >
          {canOpen ? "★" : "🔒"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-black">{label}</span>
          <span className="mt-0.5 block text-xs font-semibold opacity-80">
            {canOpen ? "Yazılı hazırlık · Zigo Plus" : "Zigo Plus ile açılır"}
          </span>
        </span>
      </button>

      {message ? <p className="text-xs font-bold text-amber-700">{message}</p> : null}

      {showUpsell && !canOpen ? (
        <ZigoPlusUpsell allowDevActivate={allowDevActivate} compact isPremium={isPremium} />
      ) : null}
    </div>
  );
}
