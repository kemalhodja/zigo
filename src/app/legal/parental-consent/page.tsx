"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { LegalLayout } from "@/components/legal-layout";

type Decision = "approved" | "rejected" | null;

export default function ParentalConsentPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [decision, setDecision] = useState<Decision>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Onam bağlantısı geçersiz. Bağlantıyı veli e-postasındaki adresten açın.");
    }
  }, [token]);

  const submitDecision = useCallback(
    async (value: Exclude<Decision, null>) => {
      setSubmitting(true);
      setError(null);
      try {
        const response = await fetch("/api/account/parental-consent/decide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, decision: value }),
        });
        const body = await response.json().catch(() => null);
        if (!response.ok) {
          setError(body?.error ?? "Onam kararı kaydedilemedi.");
          return;
        }
        setDecision(value);
      } catch {
        setError("Bağlantı hatası. Lütfen tekrar deneyin.");
      } finally {
        setSubmitting(false);
      }
    },
    [token],
  );

  return (
    <LegalLayout title="Veli Onayı">
      {!decision ? (
        <div className="space-y-4">
          <p>
            Çocuğunuz Zigo eğitim platformunda hesap oluşturdu. Zigo; öğrencilerin ders çalışma
            etkinliklerini, eğitim alanı tercihlerini ve öğrenme özetlerini işler.
          </p>
          <p>
            Onay verdiğinizde çocuğunuz platformdaki sosyal içerik akışına ve oyunlara katılabilir.
            Veriler KVKK kapsamında korunur; dilediğiniz zaman onamı geri alabilirsiniz.
          </p>

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <button
              type="button"
              disabled={submitting || !token}
              onClick={() => submitDecision("approved")}
              className="tap-scale w-full rounded-xl bg-emerald-600 py-3 font-black text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
            >
              ✅ Onaylıyorum
            </button>
            <button
              type="button"
              disabled={submitting || !token}
              onClick={() => submitDecision("rejected")}
              className="tap-scale w-full rounded-xl border border-slate-300 bg-white py-3 font-black text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              ❌ Onaylamıyorum
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {decision === "approved" ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
              ✅ Onayınız kaydedildi. Çocuğunuz Zigo'yu kullanmaya başlayabilir.
            </p>
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-700">
              Kaydınız alındı. Onam verilmediği için çocuğunuzun hesabı sınırlı kalacaktır.
            </p>
          )}
          <p className="text-sm text-slate-500">Bu sayfayı artık kapatabilirsiniz.</p>
        </div>
      )}
    </LegalLayout>
  );
}
