"use client";

import React, { useEffect, useState } from "react";
import {
  DAYS_OF_WEEK,
  HOMEWORK_PRIORITY_LABELS,
  type ArchivedExam,
  type DayOfWeek,
  type ExamItem,
  type ExamSubtopic,
  type HomeworkItem,
  type ScheduleLesson,
  getSubjectColor,
} from "@/lib/domain/agenda/types";
import {
  getCurrentAndNextClass,
  getCurriculumTemplate,
  getLessonsForDay,
  getNationalExamTemplates,
  getTodayDayOfWeek,
  isExamFinished,
  isHomeworkExpired,
} from "@/lib/domain/agenda/service";
import {
  playSchoolBell,
  playSuccessChime,
} from "@/lib/domain/agenda/sound";
import {
  getStoredAgenda,
  saveAgendaState,
  type StoredAgendaState,
} from "@/lib/domain/agenda/storage";

type AgendaManagerProps = {
  targetUserId?: string;
  isParentView?: boolean;
  childProfiles?: { id: string; name: string }[];
  currentUserName?: string;
};

type ViewMode = "day" | "week";
type HomeworkPriority = "low" | "medium" | "high" | "urgent";
type HomeworkFilter = "all" | "pending" | "completed" | HomeworkPriority;

export function AgendaManager({
  targetUserId,
  isParentView = false,
  childProfiles = [],
  currentUserName = "Öğrenci",
}: AgendaManagerProps) {
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>(
    targetUserId || (childProfiles[0]?.id ?? undefined)
  );
  const [activeTab, setActiveTab] = useState<"schedule" | "exams" | "homework" | "archive">("schedule");
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getTodayDayOfWeek());
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [homeworkFilter, setHomeworkFilter] = useState<HomeworkFilter>("all");
  const [agenda, setAgenda] = useState<StoredAgendaState>({
    lessons: [],
    exams: [],
    homeworks: [],
    archivedExams: [],
  });
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isLoaded, setIsLoaded] = useState(false);

  // Form Modals / Toggles
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);
  const [showAddHomework, setShowAddHomework] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Archive modal state
  const [archivingExam, setArchivingExam] = useState<ExamItem | null>(null);
  const [archiveScore, setArchiveScore] = useState<string>("");
  const [archiveNotes, setArchiveNotes] = useState<string>("");

  // Subtopic adding state for exams
  const [newSubtopicInputs, setNewSubtopicInputs] = useState<Record<string, string>>({});

  // Gamification celebration popup
  const [xpCelebration, setXpCelebration] = useState<{ message: string; points: number } | null>(
    null
  );

  // Form States
  const [newLesson, setNewLesson] = useState({
    subject: "",
    startTime: "09:00",
    endTime: "09:40",
    teacherName: "",
    classroom: "",
  });

  const [newExam, setNewExam] = useState({
    subject: "",
    examDate: "",
    topics: "",
    durationMinutes: 40,
  });

  const [newHomework, setNewHomework] = useState({
    subject: "",
    title: "",
    dueDate: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    notes: "",
  });

  // Undo mechanism
  const [deletedItem, setDeletedItem] = useState<{
    type: "lesson" | "exam" | "homework";
    item: ScheduleLesson | ExamItem | HomeworkItem;
  } | null>(null);

  // Load agenda data
  const loadData = () => {
    const data = getStoredAgenda(selectedChildId);
    setAgenda(data);
    setIsLoaded(true);
  };

  useEffect(() => {
    loadData();

    const handleSync = () => loadData();
    window.addEventListener("zigo:agenda-updated", handleSync);
    return () => window.removeEventListener("zigo:agenda-updated", handleSync);
  }, [selectedChildId]);

  // Canlı saat güncellemesi (her 30 saniyede bir)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Haptic feedback helper
  const triggerHaptic = (pattern: number | number[] = 20) => {
    try {
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {}
  };

  // --- Canlı Ders Durumu ---
  const liveClassStatus = getCurrentAndNextClass(agenda.lessons, currentTime);

  // --- Günlük Ders İlerlemesi ---
  const todayLessons = getLessonsForDay(agenda.lessons, getTodayDayOfWeek(currentTime));
  const currentMinutesNow = currentTime.getHours() * 60 + currentTime.getMinutes();
  const finishedTodayLessonsCount = todayLessons.filter((l) => {
    const [h, m] = l.endTime.split(":").map(Number);
    return h * 60 + m <= currentMinutesNow;
  }).length;
  const todayProgressPercent =
    todayLessons.length > 0 ? Math.round((finishedTodayLessonsCount / todayLessons.length) * 100) : 0;

  // --- Haftalık KPI İstatistikleri ---
  const totalWeeklyLessons = agenda.lessons.length;
  const totalWeeklyHours = Math.round((totalWeeklyLessons * 40) / 60);
  const activeExamsCount = agenda.exams.length;
  const pendingHomeworksCount = agenda.homeworks.filter((h) => !h.isCompleted).length;
  const urgentHomeworksCount = agenda.homeworks.filter(
    (h) => !h.isCompleted && (h.priority === "urgent" || h.priority === "high")
  ).length;

  // --- Actions: Ders Programı ---
  const handleAddLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLesson.subject.trim()) return;

    triggerHaptic(20);
    const lesson: ScheduleLesson = {
      id: `lesson-${Date.now()}`,
      dayOfWeek: selectedDay,
      subject: newLesson.subject.trim(),
      startTime: newLesson.startTime,
      endTime: newLesson.endTime,
      teacherName: newLesson.teacherName.trim(),
      classroom: newLesson.classroom.trim(),
      targetUserId: selectedChildId,
      createdAt: new Date().toISOString(),
    };

    const nextLessons = [...agenda.lessons, lesson];
    const nextState = { ...agenda, lessons: nextLessons };
    setAgenda(nextState);
    saveAgendaState(nextState, selectedChildId);

    setNewLesson({
      subject: "",
      startTime: "09:00",
      endTime: "09:40",
      teacherName: "",
      classroom: "",
    });
    setShowAddLesson(false);
  };

  const handleDeleteLesson = (lesson: ScheduleLesson) => {
    triggerHaptic(15);
    const nextLessons = agenda.lessons.filter((l) => l.id !== lesson.id);
    const nextState = { ...agenda, lessons: nextLessons };
    setAgenda(nextState);
    saveAgendaState(nextState, selectedChildId);
    setDeletedItem({ type: "lesson", item: lesson });
  };

  // Şablon yükleme
  const handleApplyTemplate = (level: "ortaokul" | "lise") => {
    triggerHaptic([20, 30, 20]);
    const template = getCurriculumTemplate(level);
    const mapped: ScheduleLesson[] = template.map((t, idx) => ({
      ...t,
      id: `tpl-${level}-${idx}-${Date.now()}`,
      targetUserId: selectedChildId,
      createdAt: new Date().toISOString(),
    }));

    const nextState = { ...agenda, lessons: mapped };
    setAgenda(nextState);
    saveAgendaState(nextState, selectedChildId);
    setShowTemplateModal(false);
  };

  // --- Actions: Sınavlar ---
  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExam.subject.trim() || !newExam.examDate) return;

    triggerHaptic(20);
    const exam: ExamItem = {
      id: `exam-${Date.now()}`,
      subject: newExam.subject.trim(),
      examDate: new Date(newExam.examDate).toISOString(),
      topics: newExam.topics.trim(),
      subtopics: newExam.topics
        ? newExam.topics
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .map((t, idx) => ({ id: `sub-${idx}-${Date.now()}`, title: t, isDone: false }))
        : [],
      durationMinutes: Number(newExam.durationMinutes) || 40,
      targetUserId: selectedChildId,
      createdAt: new Date().toISOString(),
    };

    const nextExams = [...agenda.exams, exam];
    const nextState = { ...agenda, exams: nextExams };
    setAgenda(nextState);
    saveAgendaState(nextState, selectedChildId);

    setNewExam({
      subject: "",
      examDate: "",
      topics: "",
      durationMinutes: 40,
    });
    setShowAddExam(false);
  };

  const handleAddNationalExam = (tpl: Omit<ExamItem, "id">) => {
    triggerHaptic([20, 40, 20]);
    const exam: ExamItem = {
      ...tpl,
      id: `nat-exam-${Date.now()}`,
      subtopics: tpl.topics
        ? tpl.topics
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .map((t, idx) => ({ id: `sub-${idx}-${Date.now()}`, title: t, isDone: false }))
        : [],
      targetUserId: selectedChildId,
      createdAt: new Date().toISOString(),
    };

    const nextExams = [...agenda.exams, exam];
    const nextState = { ...agenda, exams: nextExams };
    setAgenda(nextState);
    saveAgendaState(nextState, selectedChildId);
  };

  const handleToggleSubtopic = (examId: string, subtopicId: string) => {
    triggerHaptic(15);
    const nextExams = agenda.exams.map((exam) => {
      if (exam.id !== examId) return exam;
      const nextSubs = (exam.subtopics ?? []).map((sub) =>
        sub.id === subtopicId ? { ...sub, isDone: !sub.isDone } : sub
      );
      return { ...exam, subtopics: nextSubs };
    });

    const nextState = { ...agenda, exams: nextExams };
    setAgenda(nextState);
    saveAgendaState(nextState, selectedChildId);
  };

  const handleAddSubtopicToExam = (examId: string) => {
    const text = (newSubtopicInputs[examId] ?? "").trim();
    if (!text) return;

    triggerHaptic(15);
    const nextExams = agenda.exams.map((exam) => {
      if (exam.id !== examId) return exam;
      const currentSubs = exam.subtopics ?? [];
      const newSub: ExamSubtopic = {
        id: `sub-${Date.now()}`,
        title: text,
        isDone: false,
      };
      return { ...exam, subtopics: [...currentSubs, newSub] };
    });

    const nextState = { ...agenda, exams: nextExams };
    setAgenda(nextState);
    saveAgendaState(nextState, selectedChildId);

    setNewSubtopicInputs((prev) => ({ ...prev, [examId]: "" }));
  };

  const handleDeleteExam = (exam: ExamItem) => {
    triggerHaptic(15);
    const nextExams = agenda.exams.filter((e) => e.id !== exam.id);
    const nextState = { ...agenda, exams: nextExams };
    setAgenda(nextState);
    saveAgendaState(nextState, selectedChildId);
    setDeletedItem({ type: "exam", item: exam });
  };

  // --- Actions: Ödevler ---
  const handleAddHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHomework.subject.trim() || !newHomework.title.trim() || !newHomework.dueDate) return;

    triggerHaptic(20);
    const homework: HomeworkItem = {
      id: `hw-${Date.now()}`,
      subject: newHomework.subject.trim(),
      title: newHomework.title.trim(),
      dueDate: new Date(newHomework.dueDate).toISOString(),
      priority: newHomework.priority || "medium",
      notes: newHomework.notes.trim(),
      isCompleted: false,
      targetUserId: selectedChildId,
      createdAt: new Date().toISOString(),
    };

    const nextHomeworks = [...agenda.homeworks, homework];
    const nextState = { ...agenda, homeworks: nextHomeworks };
    setAgenda(nextState);
    saveAgendaState(nextState, selectedChildId);

    setNewHomework({
      subject: "",
      title: "",
      dueDate: "",
      priority: "medium",
      notes: "",
    });
    setShowAddHomework(false);
  };

  const handleToggleHomework = (hwId: string) => {
    const targetHw = agenda.homeworks.find((h) => h.id === hwId);
    const willBeCompleted = targetHw ? !targetHw.isCompleted : false;

    if (willBeCompleted) {
      triggerHaptic([20, 50, 30]);
      playSuccessChime();
      setXpCelebration({
        message: `${targetHw?.subject || "Ödev"} başarıyla tamamlandı!`,
        points: 15,
      });
      setTimeout(() => setXpCelebration(null), 3500);
    } else {
      triggerHaptic(15);
    }

    const nextHomeworks = agenda.homeworks.map((hw) =>
      hw.id === hwId ? { ...hw, isCompleted: !hw.isCompleted } : hw
    );
    const nextState = { ...agenda, homeworks: nextHomeworks };
    setAgenda(nextState);
    saveAgendaState(nextState, selectedChildId);
  };

  const handleDeleteHomework = (hw: HomeworkItem) => {
    triggerHaptic(15);
    const nextHomeworks = agenda.homeworks.filter((h) => h.id !== hw.id);
    const nextState = { ...agenda, homeworks: nextHomeworks };
    setAgenda(nextState);
    saveAgendaState(nextState, selectedChildId);
    setDeletedItem({ type: "homework", item: hw });
  };

  // --- Undo Action ---
  const handleUndo = () => {
    if (!deletedItem) return;
    triggerHaptic(20);

    if (deletedItem.type === "lesson") {
      const restored = [...agenda.lessons, deletedItem.item as ScheduleLesson];
      const nextState = { ...agenda, lessons: restored };
      setAgenda(nextState);
      saveAgendaState(nextState, selectedChildId);
    } else if (deletedItem.type === "exam") {
      const restored = [...agenda.exams, deletedItem.item as ExamItem];
      const nextState = { ...agenda, exams: restored };
      setAgenda(nextState);
      saveAgendaState(nextState, selectedChildId);
    } else if (deletedItem.type === "homework") {
      const restored = [...agenda.homeworks, deletedItem.item as HomeworkItem];
      const nextState = { ...agenda, homeworks: restored };
      setAgenda(nextState);
      saveAgendaState(nextState, selectedChildId);
    }

    setDeletedItem(null);
  };

  // --- Print / PDF Export ---
  const handlePrint = () => {
    triggerHaptic(20);
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const lessonsForSelectedDay = getLessonsForDay(agenda.lessons, selectedDay);
  const nationalExams = getNationalExamTemplates();

  return (
    <div className="w-full space-y-4 agenda-print-container">
      {/* Veli Modu ise Çocuk Seçici */}
      {isParentView && childProfiles.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-print">
          <span className="text-xs font-black text-slate-500 shrink-0">Öğrenci:</span>
          {childProfiles.map((child) => (
            <button
              key={child.id}
              onClick={() => {
                triggerHaptic();
                setSelectedChildId(child.id);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                selectedChildId === child.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {child.name}
            </button>
          ))}
        </div>
      )}

      {/* Üst Başlık & Otomatik Silme Bilgi Rozeti */}
      <div className="flex items-center justify-between bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-4 rounded-2xl text-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🗓️</span>
            <h2 className="text-base font-black tracking-tight">Ajanda & Ders Takvimi</h2>
          </div>
          <p className="text-xs text-violet-100 mt-1">
            {isParentView
              ? "Çocuğunun ders programını, sınavlarını ve ödevlerini planla."
              : "Haftalık derslerini, yaklaşan sınavlarını ve ödevlerini takip et."}
          </p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <button
            onClick={() => {
              triggerHaptic();
              playSchoolBell();
            }}
            title="Ders Zilini Çal"
            className="inline-flex items-center gap-1 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md px-2.5 py-1.5 text-xs font-bold text-white transition"
          >
            🔔 Zil Çal
          </button>
          <button
            onClick={handlePrint}
            title="Ders Programını Yazdır / PDF Kaydet"
            className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md px-2.5 py-1.5 text-xs font-bold text-white transition"
          >
            🖨️ Yazdır
          </button>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md px-2.5 py-1 text-[0.68rem] font-bold text-white">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Otomatik Arınma Aktif
          </span>
        </div>
      </div>

      {/* 📊 HAFTALIK KPI ÖZET METRİKLERİ */}
      <div className="grid grid-cols-3 gap-2 no-print">
        <div className="rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-xs">
          <p className="text-[0.68rem] font-bold text-slate-400">⏱️ Toplam Ders</p>
          <p className="text-base font-black text-indigo-950 mt-0.5">
            {totalWeeklyLessons} Ders <span className="text-[0.68rem] text-slate-400 font-semibold">({totalWeeklyHours} sa)</span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-xs">
          <p className="text-[0.68rem] font-bold text-slate-400">🎯 Aktif Sınav</p>
          <p className="text-base font-black text-rose-600 mt-0.5">
            {activeExamsCount} Sınav
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-xs">
          <p className="text-[0.68rem] font-bold text-slate-400">📝 Bekleyen Ödev</p>
          <p className="text-base font-black text-emerald-600 mt-0.5">
            {pendingHomeworksCount} Ödev
          </p>
        </div>
      </div>

      {/* 🟢 CANLI DERS & TENEFFÜS DURUM KARTI */}
      {(liveClassStatus.currentLesson || liveClassStatus.nextLesson) && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-3.5 shadow-xs animate-in fade-in duration-200 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white text-base shadow-xs animate-pulse">
                {liveClassStatus.currentLesson ? "🔔" : "☕"}
              </span>
              <div>
                <span className="text-[0.65rem] font-black uppercase tracking-wider text-emerald-700">
                  {liveClassStatus.currentLesson ? "Şu Anda Ders İşleniyor" : "Teneffüs / Mola"}
                </span>
                <h4 className="text-xs font-black text-night mt-0.5">
                  {liveClassStatus.currentLesson ? (
                    <>
                      {liveClassStatus.currentLesson.subject} ({liveClassStatus.currentLesson.startTime} -{" "}
                      {liveClassStatus.currentLesson.endTime}) · Bitmesine{" "}
                      <strong className="text-emerald-700 font-black">
                        {liveClassStatus.minutesLeftInCurrent} dk
                      </strong>{" "}
                      kaldı
                    </>
                  ) : liveClassStatus.nextLesson ? (
                    <>
                      Sıradaki Ders: {liveClassStatus.nextLesson.subject} (
                      {liveClassStatus.nextLesson.startTime}) ·{" "}
                      <strong className="text-teal-700 font-black">
                        {liveClassStatus.minutesUntilNext} dk sonra
                      </strong>
                    </>
                  ) : null}
                </h4>
              </div>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-[0.68rem] font-black text-emerald-700 shadow-xs border border-emerald-100">
              Canlı Takip
            </span>
          </div>
        </div>
      )}

      {/* 📈 GÜNLÜK DERS TAMAMLAMA İLERLEMESİ */}
      {todayLessons.length > 0 && (
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 no-print">
          <div className="flex items-center justify-between text-xs font-black text-slate-700 mb-1.5">
            <span>Bugünün Okul Akışı</span>
            <span className="text-indigo-600">
              {finishedTodayLessonsCount} / {todayLessons.length} Ders Bitti (%{todayProgressPercent})
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${todayProgressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* 🎉 Ödev Tamamlama Motivasyon Rozeti */}
      {xpCelebration && (
        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-3.5 shadow-lg animate-in zoom-in-95 duration-200 no-print">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-bounce">🎉</span>
            <div>
              <h4 className="text-xs font-black tracking-wide">
                Harika İş! +{xpCelebration.points} XP Kazanıldı!
              </h4>
              <p className="text-[0.68rem] text-amber-100 mt-0.5">{xpCelebration.message}</p>
            </div>
          </div>
          <span className="text-lg">⭐</span>
        </div>
      )}

      {/* Geri Al (Undo) Bildirim Bandı */}
      {deletedItem && (
        <div className="flex items-center justify-between rounded-xl bg-slate-900 text-white px-4 py-2.5 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-200 no-print">
          <span className="text-xs font-semibold">
            {deletedItem.type === "lesson" && "Ders silindi."}
            {deletedItem.type === "exam" && "Sınav silindi."}
            {deletedItem.type === "homework" && "Ödev silindi."}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleUndo}
              className="text-xs font-black text-amber-400 hover:underline"
            >
              Geri Al (Undo)
            </button>
            <button
              onClick={() => setDeletedItem(null)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Ajanda Sekmeleri: Ders Programı / Sınavlar / Ödevler */}
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 no-print">
        <button
          onClick={() => {
            triggerHaptic();
            setActiveTab("schedule");
          }}
          className={`rounded-lg py-2 text-xs font-black transition ${
            activeTab === "schedule"
              ? "bg-white text-indigo-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          📚 Ders Programı ({agenda.lessons.length})
        </button>
        <button
          onClick={() => {
            triggerHaptic();
            setActiveTab("exams");
          }}
          className={`rounded-lg py-2 text-xs font-black transition ${
            activeTab === "exams"
              ? "bg-white text-indigo-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          🎯 Sınavlar ({agenda.exams.length})
        </button>
        <button
          onClick={() => {
            triggerHaptic();
            setActiveTab("homework");
          }}
          className={`rounded-lg py-2 text-xs font-black transition ${
            activeTab === "homework"
              ? "bg-white text-indigo-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          📝 Ödevler ({agenda.homeworks.filter((h) => !h.isCompleted).length})
        </button>
      </div>

      {/* TAB 1: DERS PROGRAMI */}
      {activeTab === "schedule" && (
        <div className="space-y-3">
          {/* Gün Seçici Butonları */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-print">
            {DAYS_OF_WEEK.map((d) => {
              const isToday = getTodayDayOfWeek() === d.value;
              const count = agenda.lessons.filter((l) => l.dayOfWeek === d.value).length;
              return (
                <button
                  key={d.value}
                  onClick={() => {
                    triggerHaptic();
                    setSelectedDay(d.value as DayOfWeek);
                  }}
                  className={`flex flex-col items-center flex-1 min-w-[50px] py-2 px-1 rounded-xl text-xs font-black transition border ${
                    selectedDay === d.value
                      ? "border-indigo-600 bg-indigo-50/80 text-indigo-700 shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{d.shortLabel}</span>
                  {isToday && (
                    <span className="text-[0.6rem] font-bold text-indigo-600 mt-0.5">Bugün</span>
                  )}
                  {count > 0 && !isToday && (
                    <span className="text-[0.6rem] text-slate-400 mt-0.5">{count} ders</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Aksiyon Butonları: Ders Ekle & Hazır Şablon & Yazdır */}
          <div className="flex items-center justify-between pt-1 no-print">
            <h3 className="text-xs font-black text-slate-700">
              {DAYS_OF_WEEK.find((d) => d.value === selectedDay)?.label} Dersleri
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowTemplateModal(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                ⚡ Hazır Şablon
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex sm:hidden items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700"
              >
                🖨️
              </button>
              <button
                onClick={() => {
                  triggerHaptic();
                  setShowAddLesson(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-black text-white hover:bg-indigo-700 shadow-xs transition"
              >
                <span>+</span> Ders Ekle
              </button>
            </div>
          </div>

          {/* Hazır Müfredat Şablonu Modal */}
          {showTemplateModal && (
            <div className="rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm space-y-3 animate-in fade-in duration-150 no-print">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-indigo-950">
                  ⚡ Hazır Okul Müfredat Şablonu Yükle
                </h4>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
              <p className="text-[0.7rem] text-slate-500 leading-relaxed">
                Tüm haftayı tek tıkla standart MEB ders programıyla doldurun.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleApplyTemplate("ortaokul")}
                  className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-left hover:bg-indigo-100/60 transition"
                >
                  <p className="text-xs font-black text-indigo-900">🎒 Ortaokul Programı</p>
                  <p className="text-[0.65rem] text-slate-500 mt-0.5">5-8. sınıflar için 20 ders</p>
                </button>
                <button
                  onClick={() => handleApplyTemplate("lise")}
                  className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-left hover:bg-blue-100/60 transition"
                >
                  <p className="text-xs font-black text-blue-900">🎓 Lise Programı</p>
                  <p className="text-[0.65rem] text-slate-500 mt-0.5">9-12. sınıflar için 20 ders</p>
                </button>
              </div>
            </div>
          )}

          {/* Yeni Ders Ekleme Formu */}
          {showAddLesson && (
            <form
              onSubmit={handleAddLesson}
              className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150 no-print"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-indigo-950">
                  Yeni Ders: {DAYS_OF_WEEK.find((d) => d.value === selectedDay)?.label}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddLesson(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Kapat
                </button>
              </div>

              <div>
                <label className="text-[0.7rem] font-bold text-slate-600 block mb-1">
                  Ders Adı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="örn. Matematik, Fizik, Türkçe"
                  value={newLesson.subject}
                  onChange={(e) => setNewLesson({ ...newLesson, subject: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[0.7rem] font-bold text-slate-600 block mb-1">
                    Başlangıç Saati *
                  </label>
                  <input
                    type="time"
                    required
                    value={newLesson.startTime}
                    onChange={(e) => setNewLesson({ ...newLesson, startTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[0.7rem] font-bold text-slate-600 block mb-1">
                    Bitiş Saati *
                  </label>
                  <input
                    type="time"
                    required
                    value={newLesson.endTime}
                    onChange={(e) => setNewLesson({ ...newLesson, endTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[0.7rem] font-bold text-slate-600 block mb-1">
                    Öğretmen (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    placeholder="örn. Ahmet Hoca"
                    value={newLesson.teacherName}
                    onChange={(e) => setNewLesson({ ...newLesson, teacherName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[0.7rem] font-bold text-slate-600 block mb-1">
                    Derslik / Not
                  </label>
                  <input
                    type="text"
                    placeholder="örn. Derslik 3A"
                    value={newLesson.classroom}
                    onChange={(e) => setNewLesson({ ...newLesson, classroom: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddLesson(false)}
                  className="rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-700"
                >
                  Dersi Kaydet
                </button>
              </div>
            </form>
          )}

          {/* Günün Ders Listesi */}
          {lessonsForSelectedDay.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center no-print">
              <span className="text-3xl">📖</span>
              <p className="mt-2 text-xs font-bold text-slate-700">Bu gün için ders eklenmemiş.</p>
              <p className="mt-1 text-[0.7rem] text-slate-400">
                Yukarıdaki "Ders Ekle" veya "⚡ Hazır Şablon" butonuyla derslerinizi oluşturabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              {lessonsForSelectedDay.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 size-11 shrink-0 font-black">
                      <span className="text-xs">{lesson.startTime}</span>
                      <span className="text-[0.62rem] text-indigo-400">{lesson.endTime}</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-night">{lesson.subject}</h4>
                      <p className="text-[0.7rem] text-slate-400 mt-0.5">
                        {lesson.teacherName && `${lesson.teacherName}`}
                        {lesson.teacherName && lesson.classroom && " · "}
                        {lesson.classroom && `${lesson.classroom}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteLesson(lesson)}
                    className="text-slate-300 hover:text-rose-500 p-1.5 transition text-xs no-print"
                    title="Dersi Sil"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SINAVLAR */}
      {activeTab === "exams" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between no-print">
            <div>
              <h3 className="text-xs font-black text-slate-700">Yaklaşan Sınavlar</h3>
              <p className="text-[0.68rem] text-slate-400 mt-0.5">
                Sınav saati bittiğinde sistem tarafından otomatik olarak silinir.
              </p>
            </div>
            <button
              onClick={() => {
                triggerHaptic();
                setShowAddExam(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-black text-white hover:bg-rose-700 shadow-xs transition"
            >
              <span>+</span> Sınav Ekle
            </button>
          </div>

          {/* 📌 RESMİ LGS & YKS SINAV ŞABLONU EKLEME BANDI */}
          <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-3.5 space-y-2 no-print">
            <span className="text-[0.68rem] font-black uppercase tracking-wider text-rose-800">
              📌 Merkezi Sınav Takvimi (MEB & ÖSYM)
            </span>
            <div className="flex flex-wrap gap-2">
              {nationalExams.map((nat) => (
                <button
                  key={nat.subject}
                  onClick={() => handleAddNationalExam(nat)}
                  className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-900 hover:bg-rose-100/60 shadow-xs transition flex items-center gap-1.5"
                >
                  <span>+</span> {nat.subject.split(" - ")[0]} Ekle
                </button>
              ))}
            </div>
          </div>

          {/* Yeni Sınav Formu */}
          {showAddExam && (
            <form
              onSubmit={handleAddExam}
              className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150 no-print"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-rose-950">Yeni Sınav Ekle</h4>
                <button
                  type="button"
                  onClick={() => setShowAddExam(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Kapat
                </button>
              </div>

              <div>
                <label className="text-[0.7rem] font-bold text-slate-600 block mb-1">
                  Sınav / Ders Adı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="örn. Matematik 1. Dönem 1. Yazılı"
                  value={newExam.subject}
                  onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[0.7rem] font-bold text-slate-600 block mb-1">
                    Sınav Tarihi & Saati *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newExam.examDate}
                    onChange={(e) => setNewExam({ ...newExam, examDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[0.7rem] font-bold text-slate-600 block mb-1">
                    Sınav Süresi (Dakika)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={300}
                    value={newExam.durationMinutes}
                    onChange={(e) =>
                      setNewExam({ ...newExam, durationMinutes: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[0.7rem] font-bold text-slate-600 block mb-1">
                  Sınav Konuları (Virgülle ayırarak girin)
                </label>
                <textarea
                  rows={2}
                  placeholder="örn. Üslü Sayılar, Köklü Sayılar, Çarpanlara Ayırma"
                  value={newExam.topics}
                  onChange={(e) => setNewExam({ ...newExam, topics: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddExam(false)}
                  className="rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white hover:bg-rose-700"
                >
                  Sınavı Kaydet
                </button>
              </div>
            </form>
          )}

          {/* Sınav Listesi */}
          {agenda.exams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center no-print">
              <span className="text-3xl">🎯</span>
              <p className="mt-2 text-xs font-bold text-slate-700">Bekleyen sınav bulunmuyor.</p>
              <p className="mt-1 text-[0.7rem] text-slate-400">
                Yaklaşan yazılı ve deneme sınavlarınızı ekleyerek hatırlatıcı alabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {agenda.exams.map((exam) => {
                const dateObj = new Date(exam.examDate);
                const formattedDate = dateObj.toLocaleDateString("tr-TR", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const hoursLeft = Math.round(
                  (dateObj.getTime() - Date.now()) / (1000 * 60 * 60)
                );

                const subtopics = exam.subtopics ?? [];
                const doneCount = subtopics.filter((s) => s.isDone).length;
                const progressPct =
                  subtopics.length > 0 ? Math.round((doneCount / subtopics.length) * 100) : 0;

                return (
                  <div
                    key={exam.id}
                    className="rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50/50 via-white to-white p-4 shadow-xs hover:border-rose-200 transition space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[0.65rem] font-black text-rose-700">
                            {hoursLeft <= 24
                              ? hoursLeft <= 0
                                ? "Şu Anda"
                                : `${hoursLeft} saat kaldı`
                              : `${Math.ceil(hoursLeft / 24)} gün kaldı`}
                          </span>
                          <span className="text-[0.7rem] font-bold text-slate-500">
                            📅 {formattedDate} ({exam.durationMinutes} dk)
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-night">{exam.subject}</h4>
                      </div>
                      <button
                        onClick={() => handleDeleteExam(exam)}
                        className="text-slate-300 hover:text-rose-600 p-1 transition text-xs no-print"
                        title="Sınavı Sil"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Sınav Konu Kontrol Listesi (Checklist) & İlerleme */}
                    {subtopics.length > 0 && (
                      <div className="pt-2 border-t border-rose-100/60 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-600">
                            📝 Konu Hazırlığı ({doneCount}/{subtopics.length})
                          </span>
                          <span className="font-black text-rose-600">%{progressPct} Hazır</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-rose-100/80 overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>

                        <div className="space-y-1 pt-1">
                          {subtopics.map((sub) => (
                            <label
                              key={sub.id}
                              className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none hover:text-night"
                            >
                              <input
                                type="checkbox"
                                checked={sub.isDone}
                                onChange={() => handleToggleSubtopic(exam.id, sub.id)}
                                className="size-3.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                              />
                              <span className={sub.isDone ? "line-through text-slate-400" : ""}>
                                {sub.title}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hızlı Alt Konu Ekleme */}
                    <div className="flex items-center gap-1.5 pt-1 no-print">
                      <input
                        type="text"
                        placeholder="+ Yeni konu ekle..."
                        value={newSubtopicInputs[exam.id] ?? ""}
                        onChange={(e) =>
                          setNewSubtopicInputs((prev) => ({
                            ...prev,
                            [exam.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddSubtopicToExam(exam.id);
                          }
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 flex-1"
                      />
                      <button
                        onClick={() => handleAddSubtopicToExam(exam.id)}
                        className="rounded-lg bg-rose-100 text-rose-700 px-2.5 py-1 text-xs font-bold hover:bg-rose-200 transition shrink-0"
                      >
                        Ekle
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ÖDEVLER */}
      {activeTab === "homework" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between no-print">
            <div>
              <h3 className="text-xs font-black text-slate-700">Ödevler ve Görevler</h3>
              <p className="text-[0.68rem] text-slate-400 mt-0.5">
                Bitiş tarihi dolan ödevler otomatik olarak silinir.
              </p>
            </div>
            <button
              onClick={() => {
                triggerHaptic();
                setShowAddHomework(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-700 shadow-xs transition"
            >
              <span>+</span> Ödev Ekle
            </button>
          </div>

          {/* Yeni Ödev Formu */}
          {showAddHomework && (
            <form
              onSubmit={handleAddHomework}
              className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150 no-print"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-emerald-950">Yeni Ödev Ekle</h4>
                <button
                  type="button"
                  onClick={() => setShowAddHomework(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Kapat
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[0.7rem] font-bold text-slate-600 block mb-1">
                    Ders Adı *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="örn. Türkçe, Fen"
                    value={newHomework.subject}
                    onChange={(e) =>
                      setNewHomework({ ...newHomework, subject: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[0.7rem] font-bold text-slate-600 block mb-1">
                    Son Teslim Tarihi *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newHomework.dueDate}
                    onChange={(e) =>
                      setNewHomework({ ...newHomework, dueDate: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[0.7rem] font-bold text-slate-600 block mb-1">
                  Ödev Açıklaması *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="örn. Sayfa 40-42 arası alıştırmalar ve özet çıkarımı."
                  value={newHomework.title}
                  onChange={(e) =>
                    setNewHomework({ ...newHomework, title: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddHomework(false)}
                  className="rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700"
                >
                  Ödevi Kaydet
                </button>
              </div>
            </form>
          )}

          {/* Ödev Listesi */}
          {agenda.homeworks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center no-print">
              <span className="text-3xl">✨</span>
              <p className="mt-2 text-xs font-bold text-slate-700">Bekleyen ödev bulunmuyor!</p>
              <p className="mt-1 text-[0.7rem] text-slate-400">
                Tüm ödevler tamamlandı veya teslim tarihi geçenler otomatik temizlendi.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              {agenda.homeworks.map((hw) => {
                const dateObj = new Date(hw.dueDate);
                const formattedDate = dateObj.toLocaleDateString("tr-TR", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const hoursLeft = Math.round(
                  (dateObj.getTime() - Date.now()) / (1000 * 60 * 60)
                );

                return (
                  <div
                    key={hw.id}
                    className={`flex items-start justify-between p-3.5 transition ${
                      hw.isCompleted ? "bg-slate-50 opacity-60" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={hw.isCompleted}
                        onChange={() => handleToggleHomework(hw.id)}
                        className="mt-1 size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-bold text-slate-600">
                            {hw.subject}
                          </span>
                          <span
                            className={`text-[0.68rem] font-bold ${
                              hoursLeft <= 24 ? "text-amber-600 font-black" : "text-slate-400"
                            }`}
                          >
                            ⏳ Son: {formattedDate}
                          </span>
                        </div>
                        <h4
                          className={`text-xs font-black mt-1 text-night ${
                            hw.isCompleted ? "line-through text-slate-400" : ""
                          }`}
                        >
                          {hw.title}
                        </h4>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteHomework(hw)}
                      className="text-slate-300 hover:text-rose-500 p-1 transition text-xs shrink-0 no-print"
                      title="Ödevi Sil"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
