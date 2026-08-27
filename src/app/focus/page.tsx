"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useToast } from "@/components/ui/toast-system";
import { useAudio } from "@/hooks/use-audio";
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

export default function FocusPage() {
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();
  const { playSound } = useAudio();

  const [analytics, setAnalytics] = useState<FocusAnalytics | null>(null);
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [timeLeft, setTimeLeft] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState("Focused study");
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState(5);
  const [planTopic, setPlanTopic] = useState("Weekly focus plan");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchData();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchData();
    });
    return () => {
      authListener?.subscription.unsubscribe();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [{ data: analyticsData }, { data: activeData }, { data: planData }] = await Promise.all([
        fetch("/api/learning/focus/analytics").then((r) => r.json()),
        fetch("/api/learning/focus/active").then((r) => r.json()),
        fetch("/api/learning/study-plan").then((r) => r.json()),
      ]);

      setAnalytics(analyticsData);
      setActiveSession(activeData);
      setStudyPlan(planData);

      if (activeData) {
        const elapsed = Math.floor((Date.now() - new Date(activeData.started_at).getTime()) / 1000);
        const remaining = Math.max(0, activeData.target_seconds - elapsed);
        setTimeLeft(remaining);
        setIsRunning(remaining > 0);
        if (remaining > 0) startTimer();
      } else {
        setTimeLeft(1500);
      }
    } catch (error) {
      console.error("Focus data fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStart = async () => {
    if (isRunning) return;

    const response = await fetch("/api/learning/focus/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        areaId: selectedAreaId,
        topicLabel: selectedTopic,
      }),
    });

    if (!response.ok) {
      toast.error("Odaklanma oturumu başlatılamadı");
      return;
    }

    const session = await response.json();
    if (session) {
      setActiveSession(session);
      setTimeLeft(session.target_seconds);
      setIsRunning(true);
      startTimer();
      playSound("success");
      toast.success("Odaklanma başladı! 🍅");
    }
  };

  const handleComplete = async () => {
    if (!activeSession) return;

    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const response = await fetch("/api/learning/focus/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: activeSession.id }),
    });

    if (!response.ok) {
      toast.error("Oturum tamamlanamadı");
      setIsRunning(true);
      startTimer();
      return;
    }

    const result = await response.json();
    if (result && !result.already_awarded) {
      playSound("success");
      toast.success("Odaklanma tamamlandı! +15 puan 🎉");
    } else if (result?.already_awarded) {
      toast.showToast("Bu oturum için zaten puan almışsınız", "info");
    }

    setActiveSession(null);
    setTimeLeft(1500);
    fetchData();
  };

  const handleSavePlan = async () => {
    const response = await fetch("/api/learning/study-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        areaId: selectedAreaId,
        weeklyPomodoroGoal: weeklyGoal,
        primaryTopic: planTopic,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
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
  const progress = activeSession ? 1 - timeLeft / activeSession.target_seconds : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-2">
            🍅 Odaklanma & Pomodoro
          </h1>
          <p className="text-slate-500 mt-1">Zigo Plus ile haftalık çalışma planı ve analitikler</p>
        </header>

        {/* Active Session / Timer */}
        <div className="bg-white rounded-3xl border-2 border-violet-100 shadow-xl p-6 mb-6">
          {activeSession ? (
            <>
              <div className="mb-4">
                <p className="text-xs font-black text-violet-400 uppercase tracking-wider mb-1">
                  Aktif Oturum: {activeSession.topic_label}
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
                  onClick={handleComplete}
                  disabled={!isRunning}
                  className="tap-scale flex-1 max-w-xs py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-black text-lg shadow-lg disabled:opacity-50"
                >
                  Tamamla ✅
                </button>
                <button
                  onClick={() => {
                    setIsRunning(false);
                    if (timerRef.current) clearInterval(timerRef.current);
                    setActiveSession(null);
                    setTimeLeft(1500);
                  }}
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
                  <label className="block text-xs font-black text-violet-700 mb-1">Konu / Etiket</label>
                  <input
                    type="text"
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    placeholder="Örn: Matematik - İntegraller"
                    className="w-full bg-white border border-violet-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-violet-500"
                    maxLength={120}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-violet-700 mb-1">Eğitim Alanı (Opsiyonel)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Alan ID (İlgi alanlarınızdan biri)"
                    value={selectedAreaId ?? ""}
                    onChange={(e) => setSelectedAreaId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-white border border-violet-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-violet-700 mb-1">Süre (Dakika)</label>
                  <select
                    value={timeLeft / 60}
                    onChange={(e) => setTimeLeft(Number(e.target.value) * 60)}
                    className="w-full bg-white border border-violet-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-violet-500"
                  >
                    {[15, 25, 30, 45, 50, 60].map((m) => (
                      <option key={m} value={m}>
                        {m} dakika
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
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
              <div>
                <label className="block text-xs font-black text-violet-700 mb-1">Eğitim Alanı (Opsiyonel)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Alan ID"
                  value={selectedAreaId ?? ""}
                  onChange={(e) => setSelectedAreaId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-white border border-violet-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-violet-500"
                />
              </div>
              <button
                onClick={handleSavePlan}
                className="tap-scale w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all"
              >
                Planı Kaydet 💎
              </button>
            </div>
          )}
        </div>
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

import { useRef } from "react";