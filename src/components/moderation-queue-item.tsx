"use client";

import { useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type ModerationQueueItemProps = {
  content: string;
  id: string;
  kind: string;
  sourceTitle?: string;
  status: string;
};

export function ModerationQueueItem({
  content,
  id,
  kind,
  sourceTitle,
  status,
}: ModerationQueueItemProps) {
  const { actions: a, moderationPage: mp } = useMessages();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const statusClass =
    currentStatus === "approved"
      ? "bg-emerald-50 text-emerald-700"
      : currentStatus === "rejected"
        ? "bg-rose-50 text-rose-700"
        : "bg-amber-50 text-amber-700";

  async function moderate(nextStatus: "approved" | "rejected") {
    if (isSaving) return;

    if (id.startsWith("demo-")) {
      setCurrentStatus(nextStatus);
      setMessage(mp.previewStatus.replace("{status}", nextStatus));
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/social/moderation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: id,
          kind: kind === "comment" ? "comment" : "story_reply",
          status: nextStatus,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(payload?.error ?? mp.actionFailed);
        return;
      }

      setCurrentStatus(nextStatus);
      setMessage(mp.marked.replace("{status}", nextStatus));
    } catch {
      setMessage(a.connectionFailedTryAgain);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className="py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{kind}</p>
          {sourceTitle ? <p className="mt-1 text-xs font-bold text-slate-500">{sourceTitle}</p> : null}
        </div>
        <span className={`rounded-lg px-3 py-1 text-xs font-black ${statusClass}`}>
          {currentStatus}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-700">{content}</p>
      {currentStatus === "pending" ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            className="tap-scale zigo-cta tap-scale rounded-lg px-3 py-2 text-xs font-black text-white disabled:opacity-60"
            disabled={isSaving}
            onClick={() => moderate("approved")}
            type="button"
          >
            {isSaving ? a.working : a.approve}
          </button>
          <button
            className="tap-scale rounded-lg bg-rose-50 px-3 py-2 text-xs font-black text-rose-600 disabled:opacity-60"
            disabled={isSaving}
            onClick={() => moderate("rejected")}
            type="button"
          >
            {isSaving ? a.working : a.reject}
          </button>
        </div>
      ) : null}
      {message ? <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-crystal">{message}</p> : null}
    </article>
  );
}
