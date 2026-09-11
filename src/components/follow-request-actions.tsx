"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type FollowRequestActionsProps = {
  requesterId: string;
};

export function FollowRequestActions({ requesterId }: FollowRequestActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "accepting" | "rejecting" | "accepted" | "rejected">("idle");

  async function handleAction(action: "accept" | "reject") {
    if (status !== "idle") return;
    setStatus(action === "accept" ? "accepting" : "rejecting");

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(action === "accept" ? 15 : 10);
    }

    try {
      const response = await fetch("/api/social/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          requesterId,
        }),
      });

      if (response.ok) {
        setStatus(action === "accept" ? "accepted" : "rejected");
        router.refresh();
      } else {
        setStatus("idle");
      }
    } catch {
      setStatus("idle");
    }
  }

  if (status === "accepted") {
    return (
      <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-black text-emerald-700">
        Kabul Edildi ✓
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-black text-slate-500">
        Silindi
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        disabled={status !== "idle"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void handleAction("accept");
        }}
        className="tap-scale rounded-lg bg-crystal px-3 py-1.5 text-xs font-black text-white shadow-xs transition hover:brightness-105 disabled:opacity-50"
      >
        {status === "accepting" ? "..." : "Onayla"}
      </button>
      <button
        type="button"
        disabled={status !== "idle"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void handleAction("reject");
        }}
        className="tap-scale rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
      >
        {status === "rejecting" ? "..." : "Sil"}
      </button>
    </div>
  );
}
