"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarChart2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";

type LessonPlan = {
  id: string;
  title: string;
  subject: string;
  description?: string;
  start_date: string;
  end_date?: string;
  recurrence: "once" | "weekly" | "daily";
  color: string;
  class_group_id?: string;
};

type DraftPlan = {
  title: string;
  subject: string;
  description: string;
  startDate: string;
  endDate: string;
  recurrence: "once" | "weekly" | "daily";
  color: string;
};

const SUBJECT_COLORS: { label: string; value: string }[] = [
  { label: "Matematik", value: "#6366f1" },
  { label: "Türkçe", value: "#ec4899" },
  { label: "Fen", value: "#10b981" },
  { label: "Sosyal", value: "#f59e0b" },
  { label: "İngilizce", value: "#3b82f6" },
  { label: "Fizik", value: "#8b5cf6" },
  { label: "Kimya", value: "#06b6d4" },
  { label: "Biyoloji", value: "#84cc16" },
  { label: "Tarih", value: "#ef4444" },
  { label: "Diğer", value: "#64748b" },
];

const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0
  const days: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
  return days;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function defaultDraft(): DraftPlan {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T09:00`;
  return {
    title: "",
    subject: "Matematik",
    description: "",
    startDate: local,
    endDate: "",
    recurrence: "once",
    color: "#6366f1",
  };
}

export default function TeacherSchedulePage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date>(today);
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<DraftPlan>(defaultDraft());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const days = getMonthDays(year, month);

  useEffect(() => {
    fetchPlans();
  }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchPlans() {
    setLoading(true);
    try {
      const from = new Date(year, month, 1).toISOString();
      const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const res = await fetch(`/api/teacher/schedule?from=${from}&to=${to}`);
      const json = await res.json();
      setPlans(json.plans ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function savePlan() {
    if (!draft.title.trim() || !draft.subject.trim()) {
      setError("Ders başlığı ve konu zorunludur.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Convert local datetime to ISO
      const startDateISO = new Date(draft.startDate).toISOString();
      const endDateISO = draft.endDate ? new Date(draft.endDate).toISOString() : undefined;

      const res = await fetch("/api/teacher/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          subject: draft.subject,
          description: draft.description,
          startDate: startDateISO,
          endDate: endDateISO,
          recurrence: draft.recurrence,
          color: draft.color,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Hata oluştu.");
        return;
      }

      setShowForm(false);
      setDraft(defaultDraft());
      if (navigator.vibrate) navigator.vibrate([15, 40, 15]);
      await fetchPlans();
    } finally {
      setSaving(false);
    }
  }

  async function deletePlan(id: string) {
    await fetch(`/api/teacher/schedule?id=${id}`, { method: "DELETE" });
    setPlans((prev) => prev.filter((p) => p.id !== id));
    if (navigator.vibrate) navigator.vibrate(10);
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  // Plans for the selected day
  const dayPlans = plans.filter((p) => {
    const pDate = new Date(p.start_date);
    return isSameDay(pDate, selectedDay);
  });

  // Days with plans (for calendar dots)
  const daysWithPlans = new Set(plans.map((p) => {
    const d = new Date(p.start_date);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }));

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-slate-100 bg-white px-4 py-4 shadow-xs">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-slate-400">Öğretmen Stüdyo</p>
            <h1 className="text-xl font-black text-slate-900">📅 Ders Planı & Takvim</h1>
          </div>
          <button
            type="button"
            onClick={() => { setShowForm(true); setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100); }}
            className="tap-scale flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-indigo-700 transition"
          >
            <Plus className="size-4" />
            Yeni Ders
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
        {/* Month Navigator */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm border border-slate-100">
          {/* Month Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <button type="button" onClick={prevMonth} className="tap-scale flex size-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition">
              <ChevronLeft className="size-4 text-slate-600" />
            </button>
            <h2 className="text-sm font-black text-slate-900">{MONTHS[month]} {year}</h2>
            <button type="button" onClick={nextMonth} className="tap-scale flex size-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition">
              <ChevronRight className="size-4 text-slate-600" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-2 text-center text-[0.65rem] font-black uppercase tracking-wider text-slate-400">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 p-2 gap-1">
            {days.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              const isToday = isSameDay(day, today);
              const isSelected = isSameDay(day, selectedDay);
              const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
              const hasPlan = daysWithPlans.has(key);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`relative flex flex-col items-center justify-center rounded-2xl py-2 text-xs font-bold transition tap-scale ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : isToday
                      ? "bg-indigo-50 text-indigo-700 font-black"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {day.getDate()}
                  {hasPlan && (
                    <span
                      className={`mt-0.5 size-1.5 rounded-full ${
                        isSelected ? "bg-white" : "bg-indigo-500"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Plans */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              {selectedDay.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
            </h3>
            <span className="text-xs font-bold text-slate-400">{dayPlans.length} ders</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="size-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : dayPlans.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 py-10 text-center">
              <Calendar className="mx-auto size-8 text-slate-300" />
              <p className="mt-2 text-xs font-bold text-slate-400">Bu gün için ders planı yok</p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-3 tap-scale rounded-xl bg-indigo-50 px-4 py-2 text-xs font-black text-indigo-600 hover:bg-indigo-100 transition"
              >
                + Ders Ekle
              </button>
            </div>
          ) : (
            dayPlans.map((plan) => (
              <div
                key={plan.id}
                className="group flex items-start gap-3 rounded-3xl bg-white p-4 shadow-sm border border-slate-100 hover:shadow-md transition"
              >
                <div
                  className="mt-1 size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: plan.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate">{plan.title}</p>
                  <p className="text-xs font-semibold text-slate-500">{plan.subject}</p>
                  {plan.description && (
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">{plan.description}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-2 text-[0.65rem] text-slate-400">
                    <span>🕐 {new Date(plan.start_date).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
                    {plan.recurrence !== "once" && (
                      <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-indigo-600 font-bold">
                        {plan.recurrence === "weekly" ? "Haftalık" : "Günlük"}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deletePlan(plan.id)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition flex size-7 items-center justify-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Monthly Stats */}
        <div className="rounded-3xl bg-white border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="size-4 text-indigo-500" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">{MONTHS[month]} Özeti</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-indigo-50 p-3">
              <p className="text-xl font-black text-indigo-700">{plans.length}</p>
              <p className="text-[0.65rem] font-bold text-indigo-500">Toplam Ders</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3">
              <p className="text-xl font-black text-emerald-700">
                {new Set(plans.map((p) => new Date(p.start_date).getDay())).size}
              </p>
              <p className="text-[0.65rem] font-bold text-emerald-500">Aktif Gün</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3">
              <p className="text-xl font-black text-amber-700">
                {new Set(plans.map((p) => p.subject)).size}
              </p>
              <p className="text-[0.65rem] font-bold text-amber-500">Ders Türü</p>
            </div>
          </div>
        </div>

        {/* New Plan Form */}
        {showForm && (
          <div ref={formRef} className="overflow-hidden rounded-3xl bg-white shadow-md border border-indigo-100">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Plus className="size-4 text-indigo-600" />
                <span className="text-sm font-black text-slate-900">Yeni Ders Planı</span>
              </div>
              <button
                type="button"
                onClick={() => { setShowForm(false); setDraft(defaultDraft()); setError(null); }}
                className="flex size-7 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition"
              >
                <X className="size-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-black text-slate-700">Ders Başlığı *</label>
                <input
                  type="text"
                  placeholder="Örn: Denklemler — 1. Ünite"
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black text-slate-700">Ders Konusu *</label>
                <div className="flex flex-wrap gap-1.5">
                  {SUBJECT_COLORS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, subject: s.label, color: s.value }))}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition tap-scale ${
                        draft.subject === s.label
                          ? "text-white border-transparent shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                      style={draft.subject === s.label ? { backgroundColor: s.value } : {}}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-black text-slate-700">Başlangıç *</label>
                  <input
                    type="datetime-local"
                    value={draft.startDate}
                    onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-black text-slate-700">Bitiş (opsiyonel)</label>
                  <input
                    type="datetime-local"
                    value={draft.endDate}
                    onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black text-slate-700">Tekrar</label>
                <div className="flex gap-2">
                  {(["once", "weekly", "daily"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, recurrence: r }))}
                      className={`flex-1 rounded-xl py-2 text-xs font-bold transition tap-scale ${
                        draft.recurrence === r
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {r === "once" ? "Tek Seferlik" : r === "weekly" ? "Haftalık" : "Günlük"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black text-slate-700">Açıklama (opsiyonel)</label>
                <textarea
                  placeholder="Konu detayı, ödev notu…"
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setDraft(defaultDraft()); setError(null); }}
                  className="tap-scale flex flex-1 items-center justify-center gap-1 rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  <RotateCcw className="size-3.5" />
                  İptal
                </button>
                <button
                  type="button"
                  onClick={savePlan}
                  disabled={saving}
                  className="tap-scale flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 py-3 text-xs font-black text-white hover:bg-indigo-700 disabled:opacity-60 transition"
                >
                  {saving ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  {saving ? "Kaydediliyor…" : "Ders Planını Kaydet"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
