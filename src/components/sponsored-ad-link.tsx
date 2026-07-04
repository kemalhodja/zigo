"use client";

import { useState } from "react";

type SponsoredAdLinkProps = {
  postId: string;
  label: string;
  disclosure?: string | null;
  canOpen: boolean;
  isActive?: boolean;
};

export function SponsoredAdLink({
  postId,
  label,
  disclosure = "Sponsorlu",
  canOpen,
  isActive = true,
}: SponsoredAdLinkProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (!label.trim()) return null;

  async function handleOpen() {
    if (!canOpen || !isActive) {
      setMessage("Bu sponsorlu içerik şu an tıklanabilir değil.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/social/posts/${postId}/sponsored`);
      const payload = (await response.json().catch(() => null)) as {
        data?: { url?: string };
        error?: string;
        code?: string;
      } | null;

      if (!response.ok || !payload?.data?.url) {
        setMessage(payload?.error ?? "Sponsorlu bağlantı açılamadı.");
        setLoading(false);
        return;
      }

      window.open(payload.data.url, "_blank", "noopener,noreferrer");
      setLoading(false);
    } catch {
      setMessage("Bağlantı hatası. Tekrar deneyin.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm font-bold transition ${
          canOpen && isActive
            ? "border-sky-200 bg-sky-50 text-sky-950 hover:bg-sky-100"
            : "border-slate-200 bg-slate-50 text-slate-600"
        } disabled:opacity-60`}
        disabled={loading || !canOpen || !isActive}
        onClick={() => void handleOpen()}
        type="button"
      >
        <span
          aria-hidden="true"
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
            canOpen && isActive ? "bg-sky-500 text-white" : "bg-slate-200 text-slate-600"
          }`}
        >
          AD
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-black">{label}</span>
          <span className="mt-0.5 block text-xs font-semibold opacity-80">
            {disclosure ?? "Sponsorlu"} · {isActive ? "Reklam" : "Süresi doldu"}
          </span>
        </span>
      </button>
      {message ? <p className="text-xs font-bold text-amber-700">{message}</p> : null}
    </div>
  );
}
