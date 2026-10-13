"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { buildAgendaAlertSummary } from "@/lib/domain/agenda/service";
import { getStoredAgenda, migrateAgendaStorage } from "@/lib/domain/agenda/storage";
import type { AgendaAlertSummary } from "@/lib/domain/agenda/types";

type HomeAgendaAlertProps = {
  viewerRole?: string | null;
  targetUserId?: string;
};

const DISMISSED_KEY = "zigo_agenda_dismissed_reminders_v1";

function getDismissedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function dismissReminder(id: string) {
  if (typeof window === "undefined") return;
  try {
    const dismissed = getDismissedIds();
    dismissed.add(id);
    // 24 saatten fazla id saklamayı önlemek için maksimum 100 id tut
    const arr = Array.from(dismissed).slice(-100);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(arr));
  } catch {
    // sessizce geç
  }
}

export function HomeAgendaAlert({ viewerRole, targetUserId }: HomeAgendaAlertProps) {
  const [summary, setSummary] = useState<AgendaAlertSummary | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    migrateAgendaStorage(targetUserId);
    const stored = getStoredAgenda(targetUserId);
    const res = buildAgendaAlertSummary(stored.lessons, stored.exams, stored.homeworks);
    setSummary(res);
    setDismissedIds(getDismissedIds());
  }, [targetUserId]);

  useEffect(() => {
    load();
    // Her dakika yenile (hatırlatıcı tetikleyicisi için)
    const interval = setInterval(load, 60_000);
    window.addEventListener("zigo:agenda-updated", load);
    return () => {
      clearInterval(interval);
      window.removeEventListener("zigo:agenda-updated", load);
    };
  }, [load]);

  if (!summary) return null;

  // Diğer kullanıcılarda ders programı ve ajanda bildirimi yok
  if (viewerRole && viewerRole !== "student" && viewerRole !== "parent") {
    return null;
  }

  const hasTomorrowLessons = summary.tomorrowLessons.length > 0;
  const hasUpcomingExams = summary.upcomingExams.length > 0;
  const hasUrgentHomework = summary.pendingHomeworks.some((h) => h.isUrgent);

  // Tetiklenmiş ve henüz kapatılmamış hatırlatıcılar
  const triggeredExams = summary.upcomingExams.filter(
    (e) => e.reminderTriggered && !dismissedIds.has(`exam-reminder-${e.id}`)
  );
  const triggeredHomeworks = summary.pendingHomeworks.filter(
    (h) => h.reminderTriggered && !dismissedIds.has(`hw-reminder-${h.id}`)
  );
  const hasReminders = triggeredExams.length > 0 || triggeredHomeworks.length > 0;

  // Hiçbir bildirim yoksa boş bırak
  if (!hasReminders && !hasTomorrowLessons && !hasUpcomingExams && !hasUrgentHomework) {
    return null;
  }

  const handleDismissReminder = (id: string) => {
    dismissReminder(id);
    setDismissedIds(getDismissedIds());
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  return (
    <div className="mx-4 md:mx-0 mb-3 space-y-2">

      {/* ⏰ Sınav Hatırlatıcıları */}
      {triggeredExams.map((exam) => (
        <div
          key={`exam-reminder-${exam.id}`}
          className="rounded-2xl bg-gradient-to-r from-violet-700 via-purple-600 to-violet-800 p-3.5 text-white shadow-md animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-lg shadow-xs animate-pulse">
                ⏰
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[0.65rem] font-black uppercase tracking-wider text-violet-200">
                    Sınav Hatırlatıcısı
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[0.62rem] font-black text-violet-800">
                    {exam.hoursLeft < 1
                      ? `${Math.round((new Date(exam.examDate).getTime() - Date.now()) / 60000)} dk kaldı`
                      : `${exam.hoursLeft} saat kaldı`}
                  </span>
                </div>
                <h4 className="text-xs font-black text-white mt-0.5 truncate">{exam.subject}</h4>
                {exam.topics ? (
                  <p className="text-[0.65rem] text-violet-200 truncate">{exam.topics}</p>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                href="/profile?tab=agenda"
                className="rounded-xl bg-white/20 px-3 py-1.5 text-xs font-black text-white hover:bg-white/30 transition shadow-xs"
              >
                Ajanda
              </Link>
              <button
                onClick={() => handleDismissReminder(`exam-reminder-${exam.id}`)}
                aria-label="Kapat"
                className="flex size-7 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* ⏰ Ödev Hatırlatıcıları */}
      {triggeredHomeworks.map((hw) => (
        <div
          key={`hw-reminder-${hw.id}`}
          className="rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 p-3.5 text-white shadow-md animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-lg shadow-xs animate-pulse">
                ⏰
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[0.65rem] font-black uppercase tracking-wider text-amber-200">
                    Ödev Hatırlatıcısı
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[0.62rem] font-black text-orange-800">
                    {hw.hoursLeft < 1 ? "&lt;1 saat" : `${hw.hoursLeft} saat`} kaldı
                  </span>
                </div>
                <h4 className="text-xs font-black text-white mt-0.5 truncate">{hw.subject}: {hw.title}</h4>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                href="/profile?tab=agenda"
                className="rounded-xl bg-white/20 px-3 py-1.5 text-xs font-black text-white hover:bg-white/30 transition shadow-xs"
              >
                Ajanda
              </Link>
              <button
                onClick={() => handleDismissReminder(`hw-reminder-${hw.id}`)}
                aria-label="Kapat"
                className="flex size-7 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* 1. Yaklaşan Sınav Bildirimi (48 saat içi, hatırlatıcı tetiklenmemişse) */}
      {hasUpcomingExams && !triggeredExams.some((e) => e.id === summary.upcomingExams[0].id) && (
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

      {/* 2. Yarınki Ders Programı Hatırlatması */}
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
