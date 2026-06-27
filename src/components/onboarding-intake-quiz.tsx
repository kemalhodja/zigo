"use client";

import { useState } from "react";

import { trackFunnelStep } from "@/lib/client/analytics";

type OnboardingIntakeQuizProps = {
  areaOptions: Array<{ id: number; name: string }>;
  onComplete?: () => void;
};

export function OnboardingIntakeQuiz({ areaOptions, onComplete }: OnboardingIntakeQuizProps) {
  const [gradeLevel, setGradeLevel] = useState("8");
  const [goalExam, setGoalExam] = useState<"lgs" | "yks" | "general">("lgs");
  const [struggleAreaId, setStruggleAreaId] = useState(String(areaOptions[0]?.id ?? ""));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/profile/onboarding-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gradeLevel,
          goalExam,
          struggleAreaId: struggleAreaId ? Number(struggleAreaId) : undefined,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(payload?.error ?? "Kaydedilemedi.");
        setBusy(false);
        return;
      }
      trackFunnelStep("onboarding_intake_complete", { goalExam, gradeLevel });
      onComplete?.();
      window.location.reload();
    } catch {
      setMessage("Bağlantı hatası.");
      setBusy(false);
    }
  }

  return (
    <section className="-mx-4 border-b border-crystal/20 bg-gradient-to-br from-crystal/10 to-white px-4 py-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">Kişisel plan</p>
      <h2 className="mt-1 text-xl font-black text-night">Seni tanıyalım</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Hangi sınıftasın, hedefin ne ve hangi derste zorlanıyorsun? Ana sayfan buna göre şekillenecek.
      </p>
      <div className="mt-4 space-y-3">
        <label className="block text-xs font-bold text-slate-500">
          Sınıf
          <select
            className="zigo-input mt-1 w-full rounded-xl px-3 py-2 text-sm font-semibold"
            onChange={(event) => setGradeLevel(event.target.value)}
            value={gradeLevel}
          >
            {["5", "6", "7", "8", "9", "10", "11", "12", "mezun"].map((grade) => (
              <option key={grade} value={grade}>
                {grade === "mezun" ? "Mezun" : `${grade}. sınıf`}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-bold text-slate-500">
          Hedef sınav
          <select
            className="zigo-input mt-1 w-full rounded-xl px-3 py-2 text-sm font-semibold"
            onChange={(event) => setGoalExam(event.target.value as "lgs" | "yks" | "general")}
            value={goalExam}
          >
            <option value="lgs">LGS</option>
            <option value="yks">YKS</option>
            <option value="general">Genel takip</option>
          </select>
        </label>
        <label className="block text-xs font-bold text-slate-500">
          En çok zorlandığın ders
          <select
            className="zigo-input mt-1 w-full rounded-xl px-3 py-2 text-sm font-semibold"
            onChange={(event) => setStruggleAreaId(event.target.value)}
            value={struggleAreaId}
          >
            {areaOptions.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        className="tap-scale mt-4 w-full rounded-xl bg-night px-4 py-3 text-sm font-black text-white disabled:opacity-60"
        disabled={busy}
        onClick={() => void submit()}
        type="button"
      >
        {busy ? "Kaydediliyor…" : "Planımı oluştur"}
      </button>
      {message ? <p className="mt-2 text-sm font-bold text-rose-600">{message}</p> : null}
    </section>
  );
}
