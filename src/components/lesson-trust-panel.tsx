"use client";

import { useState } from "react";

import type { LessonBookingListItem } from "@/features/booking/types";

type LessonTrustPanelProps = {
  booking: LessonBookingListItem;
  viewerRole: "parent" | "teacher";
};

export function LessonTrustPanel({ booking, viewerRole }: LessonTrustPanelProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (booking.status !== "completed") return null;

  const paymentStatus = booking.payment_status ?? "pending";

  async function postTrustAction(action: string, payload: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/trust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, bookingId: booking.id, ...payload }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(body?.error ?? "İşlem başarısız.");
        setBusy(false);
        return;
      }
      setMessage("Kaydedildi.");
      window.location.reload();
    } catch {
      setMessage("Bağlantı hatası.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
      <p className="text-xs font-black uppercase tracking-wide text-emerald-800">Güven & ödeme</p>
      <p className="mt-1 text-xs font-semibold text-slate-600">
        Durum:{" "}
        <span className="font-black text-night">
          {paymentStatus === "payment_confirmed"
            ? "Ödeme onaylandı"
            : paymentStatus === "disputed"
              ? "İtiraz açık"
              : "Onay bekleniyor"}
        </span>
      </p>

      {paymentStatus !== "payment_confirmed" && paymentStatus !== "disputed" ? (
        <button
          className="tap-scale mt-2 w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60"
          disabled={busy}
          onClick={() => void postTrustAction("confirm_payment", {})}
          type="button"
        >
          {viewerRole === "parent" ? "Ödemeyi yaptım" : "Ödeme alındı"}
        </button>
      ) : null}

      {viewerRole === "parent" && paymentStatus === "payment_confirmed" ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-bold text-slate-700">Ders değerlendirmesi</p>
          <select
            className="zigo-input w-full rounded-lg px-2 py-1 text-sm font-semibold"
            onChange={(event) => setRating(Number(event.target.value))}
            value={rating}
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} yıldız
              </option>
            ))}
          </select>
          <textarea
            className="zigo-input w-full rounded-lg px-2 py-2 text-sm"
            maxLength={500}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Kısa yorum (isteğe bağlı)"
            rows={2}
            value={comment}
          />
          <button
            className="tap-scale w-full rounded-lg bg-night px-3 py-2 text-xs font-black text-white disabled:opacity-60"
            disabled={busy}
            onClick={() => void postTrustAction("review", { rating, comment })}
            type="button"
          >
            Değerlendirmeyi gönder
          </button>
        </div>
      ) : null}

      {paymentStatus !== "disputed" ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-black text-rose-700">Zigo Destek — İtiraz aç</summary>
          <textarea
            className="zigo-input mt-2 w-full rounded-lg px-2 py-2 text-sm"
            minLength={10}
            onChange={(event) => setDisputeReason(event.target.value)}
            placeholder="Sorunu kısaca anlatın (min. 10 karakter)"
            rows={3}
            value={disputeReason}
          />
          <button
            className="tap-scale mt-2 w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-black text-rose-700 disabled:opacity-60"
            disabled={busy || disputeReason.trim().length < 10}
            onClick={() => void postTrustAction("dispute", { reason: disputeReason })}
            type="button"
          >
            İtiraz gönder
          </button>
        </details>
      ) : null}

      {message ? <p className="mt-2 text-xs font-bold text-slate-600">{message}</p> : null}
    </div>
  );
}
