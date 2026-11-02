"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { LiveFocusPulse } from "@/components/live-focus-pulse";
import { useToast } from "@/components/ui/toast-system";
import { useAudio } from "@/hooks/use-audio";
import { triggerHaptic } from "@/lib/client/haptics";
import { createClient } from "@/lib/supabase/client";

type FocusAnalytics = {
  completed_sessions: number;
  focus_minutes_week: number;
  shared_moments: number;
  weekly_goal: number;
  weekly_completed: number;
  points_from_focus: number;
  active_session_id: string | null;
  active_session_started_at: string | null;
  active_session_target_seconds: number | null;
  active_session_topic: string | null;
};

type FocusSession = {
  id: string;
  user_id: string;
  area_id: number | null;
  topic_label: string;
  target_seconds: number;
  started_at: string;
  completed_at: string | null;
  status: "in_progress" | "completed" | "cancelled";
  points_awarded: number;
};

type StudyPlan = {
  id: string;
  user_id: string;
  area_id: number | null;
  weekly_pomodoro_goal: number;
  primary_topic: string;
  is_active: boolean;
  updated_at: string;
};

const LOCAL_SESSION_STORAGE_KEY = "zigo:personal_focus_session_v1";

const TOPIC_PRESETS = [
  "Matematik Soru Çözümü",
  "Paragraf & Türkçe",
  "Fen Bilimleri Tekrarı",
  "YKS / LGS Deneme Analizi",
  "Serbest Odaklanma",
];

export default function FocusPage() {
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();
  const { playSound } = useAudio();

  const [analytics, setAnalytics] = useState<FocusAnalytics | null>(null);
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [selectedDurationMinutes, setSelectedDurationMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState("Matematik Soru Çözümü");
  const [weeklyGoal, setWeeklyGoal] = useState(5);
  const [planTopic, setPlanTopic] = useState("Haftalık Odaklanma Planı");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void fetchData();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void fetchData();
    });
    return () => {
      authListener?.subscription.unsubscribe();
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activateSessionState = (session: FocusSession) => {
    const elapsed = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
    const remaining = Math.max(0, session.target_seconds - elapsed);
    if (remaining <= 0) {
      try {
        localStorage.removeItem(LOCAL_SESSION_STORAGE_KEY);
      } catch {
        // Ignore
      }
      setActiveSession(null);
      setTimeLeft(selectedDurationMinutes * 60);
      setIsRunning(false);
      return;
    }

    setActiveSession(session);
    setTimeLeft(remaining);
    setIsRunning(true);
    try {
      localStorage.setItem(LOCAL_SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Ignore
    }
    startTimer();
  };

  const fetchData = async () => {
    try {
      const [rawAnalytics, rawActive, rawPlan] = await Promise.all([
        fetch("/api/learning/focus/analytics")
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch("/api/learning/focus/active")
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch("/api/learning/study-plan")
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);

      const analyticsData = (rawAnalytics?.data ?? rawAnalytics) as FocusAnalytics | null;
      const activeCandidate = (rawActive?.data ?? rawActive) as FocusSession | null;
      const activeData = activeCandidate && activeCandidate.id ? activeCandidate : null;
      const planCandidate = (rawPlan?.data ?? rawPlan) as StudyPlan | null;
      const planData = planCandidate && planCandidate.id ? planCandidate : null;

      if (analyticsData && typeof analyticsData.completed_sessions === "number") {
        setAnalytics(analyticsData);
      }
      if (planData) {
        setStudyPlan(planData);
      }

      if (activeData) {
        activateSessionState(activeData);
      } else {
        // Check localStorage fallback for persisted session
        let restoredLocal = false;
        try {
          const saved = localStorage.getItem(LOCAL_SESSION_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved) as FocusSession;
            if (parsed?.id && parsed?.started_at && parsed?.target_seconds) {
              const elapsed = Math.floor((Date.now() - new Date(parsed.started_at).getTime()) / 1000);
              if (elapsed < parsed.target_seconds) {
                activateSessionState(parsed);
                restoredLocal = true;
              } else {
                localStorage.removeItem(LOCAL_SESSION_STORAGE_KEY);
              }
            }
          }
        } catch {
          // Ignore
        }

        if (!restoredLocal) {
          setActiveSession(null);
          setTimeLeft(selectedDurationMinutes * 60);
        }
      }
    } catch (error) {
      console.warn("Focus data fetch warning:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          void handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStart = async () => {
    if (isRunning) return;
    triggerHaptic("medium");

    const targetSeconds = selectedDurationMinutes * 60;
    const safeTopic = selectedTopic.trim() || "Odaklanma Seansı";

    try {
      const response = await fetch("/api/learning/focus/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaId: null,
          topicLabel: safeTopic,
          targetSeconds,
        }),
      });

      if (response.ok) {
        const session = (await response.json()) as FocusSession;
        if (session && session.id) {
          activateSessionState(session);
          playSound("success");
          toast.success("Odaklanma başladı! 🍅");
          return;
        }
      }
    } catch {
      // Fallback to local session below
    }

    // Resilient local session fallback (works even if offline or guest)
    const fallbackSession: FocusSession = {
      id: `local-${Date.now()}`,
      user_id: "local",
      area_id: null,
      topic_label: safeTopic,
      target_seconds: targetSeconds,
      started_at: new Date().toISOString(),
      completed_at: null,
      status: "in_progress",
      points_awarded: 0,
    };
    activateSessionState(fallbackSession);
    playSound("success");
    toast.success("Odaklanma başladı! 🍅");
  };

  const handleComplete = async () => {
    if (!activeSession) return;
    triggerHaptic("success");

    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      localStorage.removeItem(LOCAL_SESSION_STORAGE_KEY);
    } catch {
      // Ignore
    }

    if (!activeSession.id.startsWith("local-")) {
      try {
        const response = await fetch("/api/learning/focus/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: activeSession.id }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result && !result.already_awarded) {
            playSound("success");
            toast.success("Odaklanma tamamlandı! +15 puan 🎉");
          } else if (result?.already_awarded) {
            toast.showToast("Bu oturum için zaten puan almışsınız", "info");
          } else {
            playSound("success");
            toast.success("Odaklanma tamamlandı! 🎉");
          }
        } else {
          playSound("success");
          toast.success("Odaklanma seansı tamamlandı! 🎉");
        }
      } catch {
        playSound("success");
        toast.success("Odaklanma seansı tamamlandı! 🎉");
      }
    } else {
      playSound("success");
      toast.success("Odaklanma seansı tamamlandı! 🎉");
    }

    setActiveSession(null);
    setTimeLeft(selectedDurationMinutes * 60);
    void fetchData();
  };

  const handleCancel = () => {
    triggerHaptic("light");
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      localStorage.removeItem(LOCAL_SESSION_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setActiveSession(null);
    setTimeLeft(selectedDurationMinutes * 60);
  };

  const handleSavePlan = async () => {
    triggerHaptic("light");
    const response = await fetch("/api/learning/study-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        areaId: null,
        weeklyPomodoroGoal: weeklyGoal,
        primaryTopic: planTopic.trim() || "Haftalık Odaklanma Planı",
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      if (err.upgradeRequired) {
        router.push("/pricing");
        return;
      }
      toast.error("Plan kaydedilemedi");
      return;
    }

    const plan = await response.json();
    if (plan) {
      setStudyPlan(plan);
      toast.success("Haftalık plan kaydedildi! 📅");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-600 border-t-transparent"></div>
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = activeSession ? Math.min(1, Math.max(0, 1 - timeLeft / activeSession.target_seconds)) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
            🍅 Odaklanma & Pomodoro
          </h1>
          <p className="text-slate-500 mt-1">Kişisel çalışma sayacı, canlı odak odaları ve haftalık plan</p>
          <div className="mt-3">
            <LiveFocusPulse />
          </div>
        </header>

        {/* Canlı Odak Odaları Hızlı Geçiş Kartı */}
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-5 text-white shadow-md">
          <div>
            <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
              Canlı Senkron Odalar
            </span>
            <h2 className="mt-1 text-lg font-black">Diğer Öğrencilerle Birlikte Odaklan! 🚀</h2>
            <p className="mt-0.5 text-xs font-medium text-indigo-100">
              Herkesin sayacı aynı anda işler, tamamlanan her blok +30 puan ve liderlik kazandırır.
            </p>
          </div>
          <Link
            href="/rooms?room=sessiz-odak"
            className="tap-scale shrink-0 w-full sm:w-auto rounded-2xl bg-white px-5 py-3 text-center text-xs font-black text-indigo-700 shadow-sm transition hover:bg-indigo-50"
          >
            Odak Odasına Katıl ➔
          </Link>
        </div>

        {/* Active Session / Timer */}
        <div className="bg-white rounded-3xl border-2 border-violet-100 shadow-xl p-6 mb-6">
          {activeSession ? (
            <>
              <div className="mb-4 text-center">
                <p className="text-xs font-black text-violet-500 uppercase tracking-wider mb-2">
                  🎯 Aktif Oturum: {activeSession.topic_label}
                </p>
                <div className="relative w-48 h-48 mx-auto">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="90"
                      stroke="#e0e7ff"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="90"
                      stroke="#8b5cf6"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={2 * Math.PI * 90}
                      strokeDashoffset={2 * Math.PI * 90 * (1 - progress)}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-black text-slate-800 tabular-nums">
                      {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={!isRunning}
                  className="tap-scale flex-1 max-w-xs py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-black text-lg shadow-lg disabled:opacity-50"
                >
                  Tamamla ✅
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="tap-scale flex-1 max-w-xs py-3 bg-slate-200 text-slate-700 rounded-2xl font-black text-lg shadow hover:bg-slate-300"
                >
                  İptal
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-black text-violet-700 mb-1.5">Çalışma Konusu / Hedef</label>
                  <input
                    type="text"
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    placeholder="Örn: Matematik - İntegraller"
                    className="w-full bg-white border border-violet-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-violet-500"
                    maxLength={120}
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {TOPIC_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setSelectedTopic(preset)}
                        className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                          selectedTopic === preset
                            ? "bg-violet-600 text-white"
                            : "bg-violet-50 text-violet-700 hover:bg-violet-100"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-violet-700 mb-1.5">Odaklanma Süresi (Dakika)</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[15, 25, 30, 45, 50, 60].map((m) => {
                      const isSelected = selectedDurationMinutes === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setSelectedDurationMinutes(m);
                            setTimeLeft(m * 60);
                          }}
                          className={`tap-scale rounded-xl py-2.5 text-xs font-black transition ${
                            isSelected
                              ? "bg-violet-600 text-white shadow-sm"
                              : "border border-violet-200 bg-white text-slate-700 hover:bg-violet-50"
                          }`}
                        >
                          {m} dk
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStart}
                className="tap-scale w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-violet-500/30 hover:shadow-xl transition-all"
              >
                Odaklanmayı Başlat ▶️
              </button>
            </>
          )}
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Bu Hafta Dakika" value={`${analytics?.focus_minutes_week ?? 0} dk`} icon="⏱️" color="violet" />
          <StatCard label="Tamamlanan" value={`${analytics?.weekly_completed ?? 0} / ${analytics?.weekly_goal ?? 5}`} icon="✅" color="emerald" />
          <StatCard label="Paylaşılan" value={analytics?.shared_moments ?? 0} icon="📤" color="amber" />
          <StatCard label="Puan" value={analytics?.points_from_focus ?? 0} icon="⭐" color="rose" />
        </div>

        {/* Brain Break Quick Launcher */}
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-200/90 rounded-3xl p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-2xl shadow-xs">
              ☕
            </span>
            <div>
              <h3 className="text-sm font-black text-amber-950">Mola Vakti Geldi mi?</h3>
              <p className="text-xs font-semibold text-amber-800/80">3 dakikalık hızlı zeka oyunları ile zihnini yenile ve XP kazan.</p>
            </div>
          </div>
          <Link
            href="/games"
            prefetch={true}
            className="tap-scale shrink-0 w-full sm:w-auto text-center bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl shadow-xs hover:brightness-105 transition"
          >
            Oyun Salonu 🎮
          </Link>
        </div>

        {/* Study Plan (Zigo Plus) */}
        <div className="bg-white rounded-3xl border-2 border-violet-100 shadow-xl p-6 mb-6">
          <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
            📅 Haftalık Çalışma Planı
            {!studyPlan && <span className="text-sm font-bold text-amber-500">(Zigo Plus)</span>}
          </h2>

          {studyPlan ? (
            <div className="space-y-3">
              <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                <p className="text-sm font-bold text-violet-700">{studyPlan.primary_topic}</p>
                <p className="text-xs text-violet-500 mt-1">Haftalık hedef: {studyPlan.weekly_pomodoro_goal} pomodoro</p>
                <p className="text-xs text-violet-500">İlerleme: {analytics?.weekly_completed ?? 0} / {studyPlan.weekly_pomodoro_goal}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-500 text-sm">Zigo Plus aboneliği ile haftalık çalışma planı oluşturun.</p>
              <div>
                <label className="block text-xs font-black text-violet-700 mb-1">Plan Başlığı</label>
                <input
                  type="text"
                  value={planTopic}
                  onChange={(e) => setPlanTopic(e.target.value)}
                  placeholder="Örn: Sınav Hazırlık Planı"
                  className="w-full bg-white border border-violet-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-violet-500"
                  maxLength={120}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-violet-700 mb-1">Haftalık Pomodoro Hedefi</label>
                <select
                  value={weeklyGoal}
                  onChange={(e) => setWeeklyGoal(Number(e.target.value))}
                  className="w-full bg-white border border-violet-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-violet-500"
                >
                  {[3, 5, 7, 10, 14, 21].map((n) => (
                    <option key={n} value={n}>
                      {n} pomodoro/hafta
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleSavePlan}
                className="tap-scale w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all"
              >
                Planı Kaydet 💎
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Picture-in-Picture & Desktop Floating Focus Widget Trigger */}
      <div className="hidden lg:flex justify-end max-w-2xl mx-auto px-4 pb-8">
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("toggle-pip-pomodoro", { detail: { topic: selectedTopic } })
            );
          }}
          className="tap-scale flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-xs font-black text-white shadow-md hover:brightness-110"
        >
          <span>📌 Yüzen Pomodoro & PiP Sayacını Aç</span>
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  const colors = {
    violet: "bg-violet-50 border-violet-100 text-violet-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    rose: "bg-rose-50 border-rose-100 text-rose-700",
  };
  return (
    <div className={`rounded-2xl border-2 p-4 ${colors[color as keyof typeof colors]}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-bold uppercase tracking-wider">{label}</p>
    </div>
  );
}
