"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type AdminStockFormProps = {
  productId: string;
  stockCount: number | null;
};

export function AdminStockForm({ productId, stockCount }: AdminStockFormProps) {
  const { ops: { admin: a, common: c } } = useMessages();
  const router = useRouter();
  const [value, setValue] = useState(stockCount ?? 0);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveStock() {
    if (isSaving) return;

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/store/products/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          stockCount: value,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(payload?.error ?? a.stockUpdateFailed);
        return;
      }

      setMessage(c.saved);
      router.refresh();
    } catch {
      setMessage(c.connectionFailed);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-1 text-right">
      <div className="flex items-center gap-2">
        <input
          className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-crystal"
          min={0}
          onChange={(event) => setValue(Number(event.target.value))}
          type="number"
          value={value}
        />
        <button
          className="zigo-cta tap-scale rounded-lg px-3 py-2 text-xs font-black text-white disabled:opacity-60"
          disabled={isSaving}
          onClick={saveStock}
          type="button"
        >
          {isSaving ? c.saving : c.save}
        </button>
      </div>
      {message ? <p className="rounded-lg bg-slate-50 px-2 py-1 text-[0.65rem] font-bold text-slate-600">{message}</p> : null}
    </div>
  );
}
