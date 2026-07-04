"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type ParentApprovalQueueProps = {
  items: Array<{
    id: string;
    points_spent: number;
    product: { name: string; category: string } | null;
    child: { display_name: string } | null;
  }>;
};

export function ParentApprovalQueue({ items }: ParentApprovalQueueProps) {
  const { parentApprovalQueue: q, common: c } = useMessages();
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function decide(redemptionId: string, status: "approved" | "cancelled") {
    setPendingId(redemptionId);
    setMessage("");

    try {
      const response = await fetch(`/api/store/redemptions/${redemptionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? q.saveFailed);
      }

      setMessage(status === "approved" ? q.approved : q.cancelled);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : q.saveFailed);
    } finally {
      setPendingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <section className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{q.eyebrow}</p>
        <h2 className="mt-1 text-lg font-black text-night">{q.emptyTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{q.emptyDesc}</p>
        <Link className="tap-scale mt-3 inline-flex text-sm font-black text-crystal" href="/store">
          {q.openStore}
        </Link>
      </section>
    );
  }

  return (
    <section className="-mx-4 bg-white px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{q.eyebrow}</p>
          <h2 className="mt-1 text-lg font-black text-night">{q.waitingTitle.replace("{count}", String(items.length))}</h2>
        </div>
        <Link className="zigo-compact-pill tap-scale zigo-cta rounded-lg px-3 py-2 text-xs font-black text-white" href="/store">
          {q.store}
        </Link>
      </div>
      {message ? <p className="mt-3 text-sm font-bold text-crystal">{message}</p> : null}
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <article className="rounded-lg bg-amber-50 px-3 py-3" key={item.id}>
            <p className="text-sm font-black text-night">{item.product?.name ?? q.rewardRequest}</p>
            <p className="mt-1 text-xs font-bold text-amber-800">
              {item.child?.display_name ?? q.childFallback} · {item.points_spent} {c.points} · {item.product?.category ?? q.rewardFallback}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                className="tap-scale zigo-cta rounded-lg px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                disabled={pendingId === item.id}
                onClick={() => decide(item.id, "approved")}
                type="button"
              >
                {q.approve}
              </button>
              <button
                className="tap-scale rounded-lg bg-white px-3 py-2 text-xs font-black text-night ring-1 ring-amber-200 disabled:opacity-60"
                disabled={pendingId === item.id}
                onClick={() => decide(item.id, "cancelled")}
                type="button"
              >
                {q.decline}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
