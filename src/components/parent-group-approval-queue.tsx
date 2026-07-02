"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type ParentGroupApprovalQueueProps = {
  items: Array<{
    id: string;
    kind: "create_group" | "join_group";
    note: string | null;
    group?: { name: string } | null;
    student?: { full_name: string; email: string } | null;
  }>;
};

export function ParentGroupApprovalQueue({ items }: ParentGroupApprovalQueueProps) {
  const g = useMessages().studyGroups;
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function decide(approvalId: string, decision: "approved" | "rejected") {
    setPendingId(approvalId);
    setMessage("");

    try {
      const response = await fetch(`/api/groups/approvals/${approvalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? g.approvalFailed);
      }

      setMessage(decision === "approved" ? g.approvalAccepted : g.approvalRejected);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : g.approvalFailed);
    } finally {
      setPendingId(null);
    }
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="-mx-4 bg-white px-4 py-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{g.parentQueueEyebrow}</p>
      <h2 className="mt-1 text-lg font-black text-night">{g.parentQueueTitle.replace("{count}", String(items.length))}</h2>
      {message ? <p className="mt-2 text-sm font-bold text-crystal">{message}</p> : null}
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <article className="rounded-lg bg-violet-50 px-3 py-3" key={item.id}>
            <p className="text-sm font-black text-night">
              {item.kind === "create_group" ? g.requestCreate : g.requestJoin}
              {" · "}
              {item.group?.name ?? g.groupFallback}
            </p>
            <p className="mt-1 text-xs font-bold text-slate-600">
              {item.student?.full_name ?? g.studentFallback} · {item.student?.email ?? ""}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                className="tap-scale rounded-lg bg-emerald-500 px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                disabled={pendingId === item.id}
                onClick={() => void decide(item.id, "approved")}
                type="button"
              >
                {g.approve}
              </button>
              <button
                className="tap-scale rounded-lg bg-slate-200 px-3 py-2 text-xs font-black text-night disabled:opacity-60"
                disabled={pendingId === item.id}
                onClick={() => void decide(item.id, "rejected")}
                type="button"
              >
                {g.reject}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
