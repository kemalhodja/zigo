"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

export function MarkNotificationsReadButton({ initialUnreadCount = 0 }: { initialUnreadCount?: number }) {
  const { notifications: n, common: c, actions: a } = useMessages();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function markRead() {
    if (isSaving) return;

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/social/notifications/read", {
        method: "POST",
      });

      if (!response.ok) {
        setMessage(n.markReadFailed);
        return;
      }

      setMessage(
        unreadCount > 0
          ? n.markedRead.replace("{count}", String(unreadCount))
          : n.alreadyRead,
      );
      setUnreadCount(0);
      router.refresh();
    } catch {
      setMessage(a.connectionFailed);
    } finally {
      setIsSaving(false);
    }
  }

  const countLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <div className="space-y-1 text-right">
      <button
        className="tap-scale rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-night disabled:opacity-60"
        disabled={isSaving}
        onClick={markRead}
        type="button"
      >
        {isSaving
          ? c.saving
          : unreadCount > 0
            ? n.markReadCount.replace("{count}", countLabel)
            : n.allRead}
      </button>
      {message ? <p className="rounded-lg bg-slate-50 px-2 py-1 text-[0.65rem] font-bold text-slate-600">{message}</p> : null}
    </div>
  );
}
