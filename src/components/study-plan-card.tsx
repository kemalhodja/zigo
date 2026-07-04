"use client";

import { useState } from "react";

import type { StudentFocusAnalytics } from "@/lib/domain/focus-analytics";

type StudyPlanCardProps = {
  analytics: StudentFocusAnalytics;
  areas: Array<{ id: number; area_name: string }>;
  isPremium: boolean;
};

export function StudyPlanCard({ analytics, areas, isPremium }: StudyPlanCardProps) {
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
        setMessage(payload?.error ?? "Could not save study plan.");
        setLoading(false);
        return;
      }

      setMessage("Custom study plan saved.");
    } catch {
      setMessage("Connection failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="-mx-4 space-y-3 bg-slate-950 px-4 py-4 text-white">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Study plan</p>
        <h2 className="mt-1 text-lg font-black">Weekly Pomodoro path</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-white/80">
          {isPremium
            ? "Set a custom weekly goal and primary topic. Free users keep the default 5 Pomodoros per week."
            : "Default goal: 5 Pomodoros per week. Upgrade to Zigo Plus for custom study plans and advanced analytics."}
        </p>
      </div>

      <div className="rounded-xl bg-white/10 p-3">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Current progress</p>
        <p className="mt-1 text-2xl font-black">
          {analytics.weeklyCompleted}/{analytics.weeklyGoal} this week
        </p>
      </div>

      {isPremium ? (
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Weekly goal</span>
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
            <span className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Primary topic</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none"
              maxLength={120}
              onChange={(event) => setPrimaryTopic(event.target.value)}
              value={primaryTopic}
            />
          </label>
          {areas.length > 0 ? (
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Focus area</span>
              <select
                className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white outline-none"
                onChange={(event) => setAreaId(event.target.value ? Number(event.target.value) : "")}
                value={areaId}
              >
                {areas.map((area) => (
                  <option className="text-night" key={area.id} value={area.id}>
                    {area.area_name}
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
            Save study plan
          </button>
        </div>
      ) : null}

      {message ? <p className="text-sm font-bold text-white/90">{message}</p> : null}
    </section>
  );
}
