"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { UserFeedbackQueueItem } from "@/lib/domain/admin";
import { useLocale, useMessages } from "@/lib/i18n/locale-context";

type FeedbackStatus = UserFeedbackQueueItem["status"];

type AdminFeedbackQueueProps = {
  items: UserFeedbackQueueItem[];
};

export function AdminFeedbackQueue({ items }: AdminFeedbackQueueProps) {
  const router = useRouter();
  const locale = useLocale();
  const { ops: { admin: a, common: c } } = useMessages();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const statusOptions: Array<{ value: FeedbackStatus; label: string }> = [
    { value: "open", label: a.feedbackStatusOpen },
    { value: "in_progress", label: a.feedbackStatusInProgress },
    { value: "resolved", label: a.feedbackStatusResolved },
    { value: "closed", label: a.feedbackStatusClosed },
  ];

  async function updateStatus(item: UserFeedbackQueueItem, status: FeedbackStatus) {
    if (savingId) return;

    setSavingId(item.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId: item.id, status }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(payload?.error ?? a.statusUpdateFailed);
        return;
      }
      router.refresh();
    } catch {
      setMessage(c.connectionFailed);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="-mx-4 bg-white px-4 py-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-night">{a.feedbackTitle}</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
            {a.feedbackDesc}
          </p>
        </div>
        <span className="rounded-lg bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">{items.length} {a.feedbackOpenCount}</span>
      </div>

      {message ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-xs font-bold text-rose-700">{message}</p> : null}

      {items.length === 0 ? (
        <p className="mt-5 rounded-xl bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">{a.feedbackEmpty}</p>
      ) : (
        <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
          {items.map((item) => (
            <article className="space-y-3 p-4" key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-crystal">
                    {item.category === "request" ? a.feedbackRequest : a.feedbackComplaint}
                  </p>
                  <h4 className="mt-1 font-black text-night">{item.subject}</h4>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {item.user?.full_name ?? c.unknownUser} · {item.user?.email ?? "—"}
                  </p>
                </div>
                <time className="text-[0.65rem] font-bold text-slate-400" dateTime={item.created_at}>
                  {new Date(item.created_at).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US")}
                </time>
              </div>
              <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">{item.content}</p>
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-crystal disabled:opacity-60"
                disabled={savingId === item.id}
                value={item.status}
                onChange={(event) => void updateStatus(item, event.target.value as FeedbackStatus)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
