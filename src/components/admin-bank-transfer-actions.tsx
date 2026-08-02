"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { findPlanById, formatTryPrice } from "@/lib/domain/subscription-plans";
import { useMessages } from "@/lib/i18n/locale-context";
import type { BankTransferRequestStatus } from "@/lib/supabase/database.types";

type AdminBankTransferRow = {
  id: string;
  plan_id: string;
  amount_try: number;
  reference_code: string;
  status: BankTransferRequestStatus;
  receipt_storage_path: string | null;
  created_at: string;
  user: {
    full_name: string;
    email: string;
    role: string;
  } | null;
};

export function AdminBankTransferActions({ request }: { request: AdminBankTransferRow }) {
  const {
    ops: { admin: a, common: c },
  } = useMessages();
  const router = useRouter();
  const [loading, setLoading] = useState<BankTransferRequestStatus | null>(null);
  const [message, setMessage] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const plan = findPlanById(request.plan_id);

  async function review(status: BankTransferRequestStatus) {
    if (loading) return;
    setLoading(status);
    setMessage("");

    try {
      const response = await fetch("/api/admin/bank-transfer/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          status,
          adminNote: adminNote.trim() || undefined,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(payload?.error ?? a.bankTransferReviewFailed);
        setLoading(null);
        return;
      }

      setMessage(status === "approved" ? a.bankTransferApproved : a.bankTransferRejected);
      setAdminNote("");
      router.refresh();
    } catch {
      setMessage(c.connectionFailed);
    } finally {
      setLoading(null);
    }
  }

  async function openReceipt() {
    try {
      const response = await fetch(`/api/admin/bank-transfer/receipt-url?requestId=${request.id}`);
      const payload = (await response.json().catch(() => null)) as { data?: { url?: string }; error?: string } | null;
      if (!response.ok || !payload?.data?.url) {
        setMessage(payload?.error ?? a.bankTransferReceiptFailed);
        return;
      }
      window.open(payload.data.url, "_blank", "noopener,noreferrer");
    } catch {
      setMessage(c.connectionFailed);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="sr-only">{a.bankTransferNoteLabel}</span>
        <input
          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[0.7rem] font-semibold text-night placeholder:text-slate-400"
          maxLength={500}
          onChange={(event) => setAdminNote(event.target.value)}
          placeholder={a.bankTransferNotePlaceholder}
          type="text"
          value={adminNote}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60"
          disabled={Boolean(loading)}
          onClick={() => void review("approved")}
          type="button"
        >
          {loading === "approved" ? "..." : a.bankTransferApprove}
        </button>
        <button
          className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60"
          disabled={Boolean(loading)}
          onClick={() => void review("rejected")}
          type="button"
        >
          {loading === "rejected" ? "..." : a.bankTransferReject}
        </button>
        {request.receipt_storage_path ? (
          <button
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-night"
            onClick={() => void openReceipt()}
            type="button"
          >
            {a.bankTransferOpenReceipt}
          </button>
        ) : null}
      </div>
      <p className="text-[0.65rem] font-bold text-slate-500">
        {plan?.intervalLabel ?? request.plan_id} · {formatTryPrice(request.amount_try)} · {request.reference_code}
      </p>
      {message ? <p className="rounded-lg bg-slate-50 px-2 py-1 text-[0.65rem] font-bold text-slate-600">{message}</p> : null}
    </div>
  );
}
