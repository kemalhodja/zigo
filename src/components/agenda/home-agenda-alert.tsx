"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { buildAgendaAlertSummary } from "@/lib/domain/agenda/service";
import { getStoredAgenda } from "@/lib/domain/agenda/storage";
import type { AgendaAlertSummary } from "@/lib/domain/agenda/types";

type HomeAgendaAlertProps = {
  viewerRole?: string | null;
  targetUserId?: string;
};

export function HomeAgendaAlert({ viewerRole, targetUserId }: HomeAgendaAlertProps) {
  const [summary, setSummary] = useState<AgendaAlertSummary | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const load = () => {
      const stored = getStoredAgenda(targetUserId);
      const res = buildAgendaAlertSummary(stored.lessons, stored.exams, stored.homeworks);
      setSummary(res);
    };

    load();

    const handleSync = () => load();
    window.addEventListener("zigo:agenda-updated", handleSync);
    return () => window.removeEventListener("zigo:agenda-updated", handleSync);
  }, [targetUserId]);

  if (!summary) return null;

  const hasTomorrowLessons = summary.tomorrowLessons.length > 0;
  const hasUpcomingExams = summary.upcomingExams.length > 0;
  const hasUrgentHomework = summary.pendingHomeworks.some((h) => h.isUrgent);

  // Hiçbir bildirim yoksa boş bırak
  if (!hasTomorrowLessons && !hasUpcomingExams && !hasUrgentHomework) {
    return null;
  }

  return (
    <div className="mx-4 md:mx-0 mb-3 space-y-2">
      {/* 1. Yaklaşan Sınav Bildirimi (En yüksek öncelik) */}
      {hasUpcomingExams && (
        <div className="rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 p-3.5 text-white shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/20 text-base shadow-xs animate-bounce">
                🚨
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[0.68rem] font-black uppercase tracking-wider text-rose-200">
                    Sınav Bildirimi
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.2 text-[0.62rem] font-black text-rose-700">
                    {summary.upcomingExams[0].isTomorrow
                      ? "Yarın!"
                      : summary.upcomingExams[0].isToday
                      ? "Bugün!"
                      : `${summary.upcomingExams[0].hoursLeft} saat kaldı`}
                  </span>
                </div>
                <h4 className="text-xs font-black text-white mt-0.5">
                  {summary.upcomingExams[0].subject}
                </h4>
                <p className="text-[0.68rem] text-rose-100">
                  {new Date(summary.upcomingExams[0].examDate).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  başlıyor · Süre: {summary.upcomingExams[0].durationMinutes} dk
                </p>
              </div>
            </div>
            <Link
              href="/profile?tab=agenda"
              className="rounded-xl bg-white px-3 py-1.5 text-xs font-black text-rose-700 hover:bg-rose-50 transition shrink-0 shadow-xs"
            >
              Ajanda ➔
            </Link>
          </div>
        </div>
      )}

      {/* 2. Yarınki Ders Programı Hatırlatması (1 gün önceden bildirim) */}
      {hasTomorrowLessons && (
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-indigo-50/90 p-3.5 text-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-base text-white shadow-xs">
                📅
              </span>
              <div>
                <span className="text-[0.68rem] font-black uppercase tracking-wider text-indigo-600">
                  Yarınki Ders Programın ({summary.tomorrowDayName})
                </span>
                <h4 className="text-xs font-black text-night mt-0.5">
                  Yarın {summary.tomorrowLessons.length} dersin var · İlk ders{" "}
                  {summary.tomorrowLessons[0]?.startTime} ({summary.tomorrowLessons[0]?.subject})
                </h4>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs font-black text-indigo-700 hover:text-indigo-900 px-2 py-1 rounded-lg hover:bg-indigo-100/50 transition"
              >
                {isExpanded ? "Gizle ▲" : "Göster ▼"}
              </button>
              <Link
                href="/profile?tab=agenda"
                className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-black text-white hover:bg-indigo-700 transition shadow-xs"
              >
                Düzenle
              </Link>
            </div>
          </div>

          {/* Genişletilmiş Yarınki Dersler Listesi */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-indigo-100/80 space-y-1.5 animate-in fade-in duration-150">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {summary.tomorrowLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-2 rounded-xl bg-white p-2 border border-indigo-100/60 shadow-xs"
                  >
                    <span className="rounded-lg bg-indigo-100 text-indigo-700 text-[0.65rem] font-black px-1.5 py-0.5">
                      {lesson.startTime}
                    </span>
                    <div className="overflow-hidden">
                      <p className="text-xs font-black text-night truncate">{lesson.subject}</p>
                      <p className="text-[0.62rem] text-slate-400 truncate">
                        {lesson.classroom || lesson.teacherName || "Ders"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Acil Ödev Bildirimi */}
      {hasUrgentHomework && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">📝</span>
            <div>
              <span className="font-bold text-amber-900">
                Acil Ödev: {summary.pendingHomeworks.find((h) => h.isUrgent)?.subject} -{" "}
                {summary.pendingHomeworks.find((h) => h.isUrgent)?.title}
              </span>
              <p className="text-[0.65rem] text-amber-700">Teslim süresi 24 saatten az kaldı!</p>
            </div>
          </div>
          <Link
            href="/profile?tab=agenda"
            className="text-amber-800 font-black hover:underline shrink-0"
          >
            Kontrol Et ➔
          </Link>
        </div>
      )}
    </div>
  );
}
