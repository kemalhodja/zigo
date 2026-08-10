"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { readStoreVisitedToday } from "@/components/store-visit-tracker";
import { triggerConfetti } from "@/lib/client/confetti";
import type { DailyMissionId } from "@/lib/domain/learning";
import { useMessages } from "@/lib/i18n/locale-context";

const storageKey = "zigo:daily-missions";

export function DailyMissionsCard() {
  const m = useMessages();
  const fallbackMissions = useMemo(
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
          id: "visit-store" as const,
          title: m.missions.openStore,
          reward: m.missions.spendPoints,
          href: "/store",
        },
      ] satisfies Array<{ id: DailyMissionId; title: string; reward: string; href: string }>,
    [m.missions],
  );
  
  const [missions, setMissions] = useState<Array<{ id: DailyMissionId; title: string; reward: string; href: string }>>(fallbackMissions);
  const [completedMissionIds, setCompletedMissionIds] = useState<DailyMissionId[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [message, setMessage] = useState("");
  const prevCompletedCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (completedMissionIds.length > 0) {
      if (prevCompletedCountRef.current !== null && completedMissionIds.length > prevCompletedCountRef.current) {
        triggerConfetti();
      }
      prevCompletedCountRef.current = completedMissionIds.length;
    } else {
      prevCompletedCountRef.current = 0;
    }
  }, [completedMissionIds]);

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
          dynamicMissions?: Array<{ id: DailyMissionId; title: string; reward: string; href: string }>;
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
      if (payload.data.dynamicMissions && payload.data.dynamicMissions.length > 0) {
        setMissions(payload.data.dynamicMissions);
      }
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
              <div className="mt-2 flex items-center justify-between">
                <Link className="inline-flex text-xs font-black text-crystal" href={mission.href}>
                  {m.common.go}
                </Link>
                {isCompleted && (
                  <button 
                    onClick={async () => {
                      fetch("/api/gamification/award", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "mission_complete", points: 50 })
                      }).then(() => alert("Tebrikler! 50 Zigo Puanı kazandın."));
                    }}
                    className="rounded bg-sun px-3 py-1 text-xs font-black text-white hover:bg-peach"
                  >
                    Puanı Al
                  </button>
                )}
              </div>
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
