"use client";

import { useState } from "react";

import { displayEducationAreaName } from "@/lib/domain/education-catalog";
import type { StudentFocusAnalytics } from "@/lib/domain/focus-analytics";
import { useMessages } from "@/lib/i18n/locale-context";

type StudyPlanCardProps = {
  analytics: StudentFocusAnalytics;
  areas: Array<{ id: number; area_name: string }>;
  isPremium: boolean;
};

export function StudyPlanCard({ analytics, areas, isPremium }: StudyPlanCardProps) {
  const m = useMessages().studyPlanCard;
  const [weeklyGoal, setWeeklyGoal] = useState(analytics.weeklyGoal);
  const [primaryTopic, setPrimaryTopic] = useState("Weekly focus plan");
  const [areaId, setAreaId] = useState<number | "">(areas[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function savePlan() {
    if (!isPremium || loading) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/learning/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaId: areaId === "" ? undefined : areaId,
          weeklyPomodoroGoal: weeklyGoal,
          primaryTopic,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setMessage(payload?.error ?? m.saveFailed);
        setLoading(false);
        return;
      }

      setMessage(m.customSaved);
    } catch {
      setMessage(m.connectionFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="-mx-4 space-y-3 bg-slate-950 px-4 py-4 text-white">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">{m.studyPlan}</p>
        <h2 className="mt-1 text-lg font-black">{m.weeklyPomodoroPath}</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-white/80">
          {isPremium
            ? m.isPremiumDesc
            : m.isFreeDesc}
        </p>
      </div>

      <div className="rounded-xl bg-white/10 p-3">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-white/70">{m.currentProgress}</p>
        <p className="mt-1 text-2xl font-black">
          {m.progressStatus
            .replace("{completed}", String(analytics.weeklyCompleted))
            .replace("{goal}", String(analytics.weeklyGoal))}
        </p>
      </div>

      {isPremium ? (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-white/70">{m.weeklyGoal}</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none"
              max={21}
              min={1}
              onChange={(event) => setWeeklyGoal(Number(event.target.value))}
              type="number"
              value={weeklyGoal}
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-white/70 flex items-center justify-between">
              {m.primaryTopic}
              <button 
                type="button" 
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => {
                    setPrimaryTopic("Matematik: Üslü Sayılar ve Yeni Nesil Sorular");
                    setWeeklyGoal(14);
                    setLoading(false);
                  }, 1000);
                }}
                className="text-[0.65rem] bg-violet-600 px-2 py-1 rounded-full text-white shadow-md shadow-violet-500/20 active:scale-95 transition-transform flex items-center gap-1"
              >
                🤖 AI ile Doldur
              </button>
            </span>
            <input
              className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition-all"
              maxLength={120}
              onChange={(event) => setPrimaryTopic(event.target.value)}
              value={primaryTopic}
              placeholder="Örn: Fizik Konu Tekrarı..."
            />
          </label>
          {areas.length > 0 ? (
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-white/70">{m.focusArea}</span>
              <select
                className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none"
                onChange={(event) => setAreaId(event.target.value ? Number(event.target.value) : "")}
                value={areaId}
              >
                {areas.map((area) => (
                  <option className="text-night" key={area.id} value={area.id}>
                    {displayEducationAreaName(area.area_name)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button
            className="tap-scale w-full rounded-lg bg-white px-4 py-3 text-sm font-black text-night disabled:opacity-60"
            disabled={loading}
            onClick={() => void savePlan()}
            type="button"
          >
            {loading ? m.saving : m.saveStudyPlan}
          </button>
        </div>
      ) : null}

      {message ? <p className="text-sm font-bold text-white/90">{message}</p> : null}
    </section>
  );
}
