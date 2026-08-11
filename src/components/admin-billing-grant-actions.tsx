"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type AdminBillingGrantActionsProps = {
  userId: string;
  userName: string;
  role: string;
};

export function AdminBillingGrantActions({ userId, userName, role }: AdminBillingGrantActionsProps) {
  const {
    ops: { admin: a, common: c },
  } = useMessages();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [tier, setTier] = useState<"free" | "zigo_plus">("zigo_plus");

  async function updateTier(nextTier: "free" | "zigo_plus") {
    if (loading) return;
    setLoading(`tier-${nextTier}`);
    setMessage("");

    try {
      const response = await fetch("/api/admin/users/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, tier: nextTier }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setMessage(payload?.error ?? "Abonelik güncellenemedi.");
        setLoading(null);
        return;
      }

      setMessage(nextTier === "zigo_plus" ? "Zigo Plus aktif edildi." : "Ücretsiz abonelik uygulandı.");
      router.refresh();
    } catch {
      setMessage(c.connectionFailed);
    } finally {
      setLoading(null);
    }
  }

  async function grant(body: Record<string, unknown>, loadingKey: string) {
    if (loading) return;
    setLoading(loadingKey);
    setMessage("");

    try {
      const response = await fetch("/api/admin/billing/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          note: note.trim() || undefined,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(payload?.error ?? a.grantFailed);
        setLoading(null);
        return;
      }

      setMessage(a.grantSuccess.replace("{name}", userName));
      setNote("");
      router.refresh();
    } catch {
      setMessage(c.connectionFailed);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-lg border border-amber-100 bg-amber-50/70 p-3">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.12em] text-amber-800">{a.grantTitle}</p>
      <p className="mt-1 text-[0.65rem] font-bold leading-4 text-amber-900/80">{a.grantDesc}</p>
      <label className="mt-2 block">
        <span className="sr-only">{a.grantNoteLabel}</span>
        <input
          className="w-full rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-[0.7rem] font-semibold text-night placeholder:text-slate-400"
          maxLength={240}
          onChange={(event) => setNote(event.target.value)}
          placeholder={a.grantNotePlaceholder}
          type="text"
          value={note}
        />
      </label>
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-white/70 px-2 py-1.5">
        <span className="text-[0.65rem] font-black uppercase tracking-[0.12em] text-amber-800">Tier</span>
        <select
          className="w-full rounded-md border border-amber-200 bg-white px-2 py-1 text-[0.65rem] font-bold text-night"
          onChange={(event) => setTier(event.target.value as "free" | "zigo_plus")}
          value={tier}
        >
          <option value="zigo_plus">Zigo Plus</option>
          <option value="free">Free</option>
        </select>
        <button
          className="rounded-md bg-slate-900 px-2 py-1.5 text-[0.65rem] font-black text-white disabled:opacity-60"
          disabled={Boolean(loading)}
          onClick={() => void updateTier(tier)}
          type="button"
        >
          {loading === `tier-${tier}` ? "..." : "Uygula"}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          className="rounded-lg bg-amber-500 px-2.5 py-1.5 text-[0.65rem] font-black text-night disabled:opacity-60"
          disabled={Boolean(loading)}
          onClick={() => void grant({ kind: "plus", userId, periodDays: 30 }, "plus-30")}
          type="button"
        >
          {loading === "plus-30" ? "..." : a.grantPlus30}
        </button>
        <button
          className="rounded-lg bg-amber-500 px-2.5 py-1.5 text-[0.65rem] font-black text-night disabled:opacity-60"
          disabled={Boolean(loading)}
          onClick={() => void grant({ kind: "plus", userId, periodDays: 90 }, "plus-90")}
          type="button"
        >
          {loading === "plus-90" ? "..." : a.grantPlus90}
        </button>
        <button
          className="rounded-lg bg-amber-500 px-2.5 py-1.5 text-[0.65rem] font-black text-night disabled:opacity-60"
          disabled={Boolean(loading)}
          onClick={() => void grant({ kind: "plus", userId, periodDays: 365 }, "plus-365")}
          type="button"
        >
          {loading === "plus-365" ? "..." : a.grantPlus365}
        </button>
        {role === "teacher" ? (
          <>
            <button
              className="rounded-lg border border-amber-400 bg-white px-2.5 py-1.5 text-[0.65rem] font-black text-amber-900 disabled:opacity-60"
              disabled={Boolean(loading)}
              onClick={() => void grant({ kind: "sponsor", userId, packageDays: 7 }, "sponsor-7")}
              type="button"
            >
              {loading === "sponsor-7" ? "..." : a.grantSponsor7}
            </button>
            <button
              className="rounded-lg border border-amber-400 bg-white px-2.5 py-1.5 text-[0.65rem] font-black text-amber-900 disabled:opacity-60"
              disabled={Boolean(loading)}
              onClick={() => void grant({ kind: "sponsor", userId, packageDays: 30 }, "sponsor-30")}
              type="button"
            >
              {loading === "sponsor-30" ? "..." : a.grantSponsor30}
            </button>
          </>
        ) : null}
      </div>
      {message ? (
        <p className="mt-2 rounded-lg bg-white/80 px-2 py-1 text-[0.65rem] font-bold text-slate-600">{message}</p>
      ) : null}
    </div>
  );
}
