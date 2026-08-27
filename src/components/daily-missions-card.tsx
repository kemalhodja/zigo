"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type DailyMission = {
  id: string;
  label: string;
  description: string;
  reward: string;
  href: string;
  icon: string;
  completed: boolean;
};

export function DailyMissionsCard({ 
  completedMissions = []
}: { 
  completedMissions?: string[];
}) {
  const { learnUi: l } = useMessages();
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching mission status - in real app this would come from API
    const allMissions: DailyMission[] = [
      {
        id: "watch-reel",
        label: l.missionWatchReel ?? "Reel İzle",
        description: l.missionWatchReelDesc ?? "Eğitici bir micro video izleyin",
        reward: "+10 Zigo",
        href: "/micro",
        icon: "📹",
        completed: completedMissions.includes("watch-reel"),
      },
      {
        id: "safe-duel",
        label: l.missionSafeDuel ?? "Güvenli Düello",
        description: l.missionSafeDuelDesc ?? "Bir arkadaşınıza quiz meydan okuma gönderin",
        reward: "+25 Zigo",
        href: "/duels",
        icon: "⚔️",
        completed: completedMissions.includes("safe-duel"),
      },
      {
        id: "focus-pomodoro",
        label: l.missionFocusPomodoro ?? "Pomodoro Odaklanma",
        description: l.missionFocusPomodoroDesc ?? "25 dakika odaklanma seansı tamamlayın",
        reward: "+15 Zigo",
        href: "/focus",
        icon: "🍅",
        completed: completedMissions.includes("focus-pomodoro"),
      },
      {
        id: "store-visit",
        label: l.missionStoreVisit ?? "Mağaza Ziyareti",
        description: l.missionStoreVisitDesc ?? "Kazanılan puanlarınızı harcamak için mağazayı ziyaret edin",
        reward: "Ödül Aç",
        href: "/store",
        icon: "🏪",
        completed: completedMissions.includes("store-visit"),
      },
    ];

    setMissions(allMissions);
    setIsLoading(false);
  }, [completedMissions]);

  if (isLoading) {
    return (
      <div className="-mx-4 space-y-3 border-y border-violet-100 bg-white px-4 py-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-200" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-3/4 rounded bg-slate-200" />
                <div className="h-3 w-1/2 rounded bg-slate-200" />
              </div>
              <div className="w-20 h-8 rounded-lg bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const completedCount = missions.filter((m) => m.completed).length;

  return (
    <section className="-mx-4 space-y-4 border-y border-violet-100 bg-white px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-crystal">
            {l.dailyMissionsTitle ?? "Günlük Görevler"}
          </p>
          <h3 className="mt-1 text-xl font-black text-night">
            {l.dailyMissionsSubtitle ?? "Görevleri tamamla, puan kazan"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-crystal">
            {completedCount} / {missions.length} Tamamlandı
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {missions.map((mission) => (
          <Link
            key={mission.id}
            href={mission.href}
            className={`flex items-center gap-3 p-3 rounded-2xl transition-all tap-scale ${
              mission.completed
                ? "bg-emerald-50 border-2 border-emerald-200"
                : "bg-slate-50 border-2 border-slate-200 hover:bg-white hover:border-violet-200"
            }`}
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xl">
              {mission.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-black text-slate-800 truncate">{mission.label}</p>
                {mission.completed && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.6rem] font-black text-emerald-700">
                    {l.completed ?? "Tamamlandı"}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-slate-500 truncate">{mission.description}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-crystal">{mission.reward}</p>
              <p className="text-[0.65rem] font-bold text-slate-400">
                {mission.completed ? l.claimed ?? "Alındı" : l.go ?? "Git"}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {completedCount === missions.length && (
        <div className="mt-4 rounded-xl bg-gradient-to-r from-emerald-50 to-mint-50 border-2 border-emerald-200 p-4 text-center">
          <p className="text-lg font-black text-emerald-700">🎉 Tüm günlük görevler tamamlandı!</p>
          <p className="mt-1 text-sm font-bold text-emerald-600">
            {l.allMissionsComplete ?? "Yarın yeni görevler için tekrar gel"}
          </p>
        </div>
      )}
    </section>
  );
}