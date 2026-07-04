"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { readStoreVisitedToday } from "@/components/store-visit-tracker";
import type { DailyMissionId } from "@/lib/domain/learning";
import { useMessages } from "@/lib/i18n/locale-context";

const storageKey = "zigo:daily-missions";

export function DailyMissionsCard() {
  const m = useMessages();
  const missions = useMemo(
    () =>
      [
        {
          id: "watch-reel" as const,
          title: m.missions.watchMicro,
          reward: m.missions.reward10,
          href: "/micro",
        },
        {
          id: "solve-quiz" as const,
          title: m.missions.finishQuiz,
          reward: m.missions.reward10,
          href: "/learn",
        },
        {
          id: "safe-duel" as const,
          title: m.missions.playDuel,
          reward: m.missions.reward25,
          href: "/duels",
        },
        {
          id: "focus-pomodoro" as const,
          title: m.missions.focusPomodoro,
          reward: m.missions.reward15,
          href: "/focus",
        },
        {
          id: "visit-store" as const,
          title: m.missions.openStore,
          reward: m.missions.spendPoints,
          href: "/store",
        },
      ] satisfies Array<{ id: DailyMissionId; title: string; reward: string; href: string }>,
    [m.missions],
  );
  const [completedMissionIds, setCompletedMissionIds] = useState<DailyMissionId[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadMissionProgress();
  }, []);

  async function loadMissionProgress() {
    try {
      const response = await fetch("/api/learning/missions");
      if (response.status === 401) {
        setCompletedMissionIds(readLocalCompletedMissions());
        setStreakDays(0);
        return;
      }

      const payload = (await response.json().catch(() => null)) as {
        data?: {
          completedIds: DailyMissionId[];
          streakDays: number;
        };
        error?: string;
      } | null;

      if (!response.ok || !payload?.data) {
        setCompletedMissionIds(mergeWithStoreVisit(readLocalCompletedMissions()));
        setMessage(payload?.error ?? "");
        return;
      }

      setCompletedMissionIds(mergeWithStoreVisit(payload.data.completedIds));
      setStreakDays(Math.max(0, payload.data.streakDays));
    } catch {
      setCompletedMissionIds(mergeWithStoreVisit(readLocalCompletedMissions()));
    }
  }

  return (
    <section className="-mx-4 space-y-3 bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-crystal">{m.missions.title}</p>
          <h2 className="mt-1 text-xl font-black leading-tight text-night">
            {completedMissionIds.length}/{missions.length} {m.missions.completed}
          </h2>
        </div>
        <span className="rounded-lg bg-mint px-3 py-1 text-xs font-black text-night">
          {streakDays}{m.missions.streak}
        </span>
      </div>

      {message ? <p className="text-xs font-bold text-slate-500">{message}</p> : null}

      <div className="space-y-2">
        {missions.map((mission) => {
          const isCompleted = completedMissionIds.includes(mission.id);

          return (
            <article className="rounded-lg bg-slate-50/90 p-3" key={mission.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-night">{mission.title}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{mission.reward}</p>
                </div>
                <span
                  className={`zigo-compact-pill shrink-0 rounded-lg px-3 py-1 text-xs font-black ${
                    isCompleted ? "bg-crystal text-white" : "bg-white text-slate-700"
                  }`}
                >
                  {isCompleted ? m.common.done : m.common.open}
                </span>
              </div>
              <Link className="mt-2 inline-flex text-xs font-black text-crystal" href={mission.href}>
                {m.common.go}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function mergeWithStoreVisit(completedIds: DailyMissionId[]) {
  const next = new Set(completedIds);
  if (readStoreVisitedToday()) next.add("visit-store");
  return [...next];
}

function readLocalCompletedMissions(): DailyMissionId[] {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as DailyMissionId[]) : [];
  } catch {
    return [];
  }
}
