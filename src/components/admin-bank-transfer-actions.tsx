"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { findPlanById, formatTryPrice } from "@/lib/domain/subscription-plans";
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
  const router = useRouter();
  const [loading, setLoading] = useState<BankTransferRequestStatus | null>(null);
  const [message, setMessage] = useState("");
  const plan = findPlanById(request.plan_id);

  async function review(status: BankTransferRequestStatus) {
    if (loading) return;
    setLoading(status);
    setMessage("");

    try {
      const response = await fetch("/api/admin/bank-transfer/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: request.id, status }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(payload?.error ?? "İşlem kaydedilemedi.");
        setLoading(null);
        return;
      }

      setMessage(status === "approved" ? "Onaylandı — Zigo Plus açıldı." : "Talep güncellendi.");
      router.refresh();
    } catch {
      setMessage("Bağlantı hatası.");
    } finally {
      setLoading(null);
    }
  }

  async function openReceipt() {
    try {
      const response = await fetch(`/api/admin/bank-transfer/receipt-url?requestId=${request.id}`);
      const payload = (await response.json().catch(() => null)) as { data?: { url?: string }; error?: string } | null;
      if (!response.ok || !payload?.data?.url) {
        setMessage(payload?.error ?? "Dekont açılamadı.");
        return;
      }
      window.open(payload.data.url, "_blank", "noopener,noreferrer");
    } catch {
      setMessage("Bağlantı hatası.");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60"
          disabled={Boolean(loading)}
          onClick={() => void review("approved")}
          type="button"
        >
          {loading === "approved" ? "..." : "Onayla"}
        </button>
        <button
          className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60"
          disabled={Boolean(loading)}
          onClick={() => void review("rejected")}
          type="button"
        >
          {loading === "rejected" ? "..." : "Reddet"}
        </button>
        {request.receipt_storage_path ? (
          <button
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-night"
            onClick={() => void openReceipt()}
            type="button"
          >
            Dekontu aç
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
