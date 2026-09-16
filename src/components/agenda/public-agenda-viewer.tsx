"use client";

import React, { useEffect, useState } from "react";
import { DAYS_OF_WEEK, type DayOfWeek } from "@/lib/domain/agenda/types";
import { getLessonsForDay, getTodayDayOfWeek } from "@/lib/domain/agenda/service";
import { getStoredAgenda, type StoredAgendaState } from "@/lib/domain/agenda/storage";

type PublicAgendaViewerProps = {
  userId: string;
  userName?: string;
};

export function PublicAgendaViewer({ userId, userName = "Kullanıcı" }: PublicAgendaViewerProps) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getTodayDayOfWeek());
  const [agenda, setAgenda] = useState<StoredAgendaState>({
    lessons: [],
    exams: [],
    homeworks: [],
    archivedExams: [],
  });

  useEffect(() => {
    const data = getStoredAgenda(userId);
    setAgenda(data);
  }, [userId]);

  const lessonsForSelectedDay = getLessonsForDay(agenda.lessons, selectedDay);

  return (
    <div className="w-full space-y-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🗓️</span>
          <div>
            <h3 className="text-sm font-black text-night">{userName} · Haftalık Ders Programı</h3>
            <p className="text-[0.68rem] text-slate-400">Herkese açık ders programı ve sınav takvimi</p>
          </div>
        </div>
      </div>

      {/* Gün Seçici */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {DAYS_OF_WEEK.map((d) => {
          const isToday = getTodayDayOfWeek() === d.value;
          const count = agenda.lessons.filter((l) => l.dayOfWeek === d.value).length;
          return (
            <button
              key={d.value}
              onClick={() => setSelectedDay(d.value as DayOfWeek)}
              className={`flex flex-col items-center flex-1 min-w-[48px] py-1.5 px-1 rounded-xl text-xs font-black transition border ${
                selectedDay === d.value
                  ? "border-indigo-600 bg-indigo-50/80 text-indigo-700 shadow-xs"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{d.shortLabel}</span>
              {isToday && (
                <span className="text-[0.58rem] font-bold text-indigo-600 mt-0.5">Bugün</span>
              )}
              {count > 0 && !isToday && (
                <span className="text-[0.58rem] text-slate-400 mt-0.5">{count} ders</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Seçili Günün Dersleri */}
      {lessonsForSelectedDay.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
          <p className="text-xs font-bold text-slate-500">
            {DAYS_OF_WEEK.find((d) => d.value === selectedDay)?.label} günü için kayıtlı ders yok.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/40">
          {lessonsForSelectedDay.map((lesson) => (
            <div key={lesson.id} className="flex items-center gap-3 p-3">
              <div className="flex flex-col items-center justify-center rounded-lg bg-indigo-100/70 text-indigo-700 size-10 shrink-0 font-black">
                <span className="text-[0.68rem]">{lesson.startTime}</span>
                <span className="text-[0.58rem] text-indigo-400">{lesson.endTime}</span>
              </div>
              <div>
                <h4 className="text-xs font-black text-night">{lesson.subject}</h4>
                <p className="text-[0.68rem] text-slate-400 mt-0.5">
                  {lesson.teacherName && `${lesson.teacherName}`}
                  {lesson.teacherName && lesson.classroom && " · "}
                  {lesson.classroom && `${lesson.classroom}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Yaklaşan Sınavlar */}
      {agenda.exams.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <h4 className="text-xs font-black text-rose-900 mb-2">🎯 Yaklaşan Sınavlar</h4>
          <div className="space-y-1.5">
            {agenda.exams.slice(0, 3).map((exam) => {
              const d = new Date(exam.examDate);
              const dateStr = d.toLocaleDateString("tr-TR", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <div
                  key={exam.id}
                  className="flex items-center justify-between rounded-xl bg-rose-50/60 p-2.5 border border-rose-100"
                >
                  <div>
                    <h5 className="text-xs font-black text-rose-950">{exam.subject}</h5>
                    <p className="text-[0.65rem] text-rose-700 mt-0.5">📅 {dateStr}</p>
                  </div>
                  <span className="text-[0.65rem] font-bold text-rose-600 bg-white px-2 py-0.5 rounded-full shadow-xs">
                    {exam.durationMinutes} dk
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
