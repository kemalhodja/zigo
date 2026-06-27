"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminDisputeActionsProps = {
  disputeId: string;
  reason: string;
  parentName?: string | null;
  teacherName?: string | null;
};

export function AdminDisputeActions({
  disputeId,
  reason,
  parentName,
  teacherName,
}: AdminDisputeActionsProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function resolve(status: "resolved_parent" | "resolved_teacher" | "closed") {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disputeId, status, resolutionNote: note || undefined }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(payload?.error ?? "İşlem başarısız.");
        return;
      }
      setMessage("İtiraz güncellendi.");
      router.refresh();
    } catch {
      setMessage("Bağlantı hatası.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-black text-night">
        {parentName ?? "Veli"} ↔ {teacherName ?? "Öğretmen"}
      </p>
      <p className="text-xs leading-5 text-slate-600">{reason}</p>
      <textarea
        className="zigo-input w-full rounded-lg px-2 py-2 text-sm"
        onChange={(event) => setNote(event.target.value)}
        placeholder="Zigo Destek notu (isteğe bağlı)"
        rows={2}
        value={note}
      />
      <div className="flex flex-wrap gap-2">
        <button
          className="tap-scale rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60"
          disabled={busy}
          onClick={() => void resolve("resolved_parent")}
          type="button"
        >
          Veli lehine
        </button>
        <button
          className="tap-scale rounded-lg bg-crystal px-3 py-2 text-xs font-black text-white disabled:opacity-60"
          disabled={busy}
          onClick={() => void resolve("resolved_teacher")}
          type="button"
        >
          Öğretmen lehine
        </button>
        <button
          className="tap-scale rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-60"
          disabled={busy}
          onClick={() => void resolve("closed")}
          type="button"
        >
          Kapat
        </button>
      </div>
      {message ? <p className="text-xs font-bold text-slate-600">{message}</p> : null}
    </div>
  );
}
