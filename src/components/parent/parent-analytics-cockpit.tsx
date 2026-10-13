"use client";

import { Award, BookOpen, GraduationCap, Printer, ShieldCheck, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { ChildQuizActivityItem } from "@/lib/domain/parent-dashboard";
import {
  buildParentAnalyticsSummary,
  buildParentDigest,
  type ParentInsightLevel,
} from "@/lib/domain/parent-analytics";

interface ParentAnalyticsCockpitProps {
  childName: string;
  totalPoints: number;
  gradeLevel?: string | number | null;
  activity: ChildQuizActivityItem[];
}

const LEVEL_LABEL: Record<ParentInsightLevel, string> = {
  strong: "Güçlü",
  steady: "İstikrarlı",
  needs_support: "Destek Gerekli",
};

const LEVEL_PILL: Record<ParentInsightLevel, string> = {
  strong: "bg-emerald-100 text-emerald-700",
  steady: "bg-blue-100 text-blue-700",
  needs_support: "bg-rose-100 text-rose-700",
};

const LEVEL_BAR: Record<ParentInsightLevel, string> = {
  strong: "bg-emerald-500",
  steady: "bg-indigo-500",
  needs_support: "bg-amber-500",
};

type Tab = "overview" | "quizzes" | "screen_time";

export function ParentAnalyticsCockpit({ childName, totalPoints, gradeLevel, activity }: ParentAnalyticsCockpitProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const summary = useMemo(() => buildParentAnalyticsSummary(activity), [activity]);
  const digest = useMemo(() => buildParentDigest(childName, summary), [childName, summary]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Genel Bakış" },
    { id: "quizzes", label: "Quiz Başarısı" },
    { id: "screen_time", label: "Ekran & Oyun Kuralları" },
  ];

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm print:border-none print:shadow-none">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-pink-600">Veli Analiz Kokpiti</span>
          <h3 className="mt-1 text-xl font-black text-slate-900">{childName} · Gelişim Karnesi</h3>
          <p className="text-xs font-semibold text-slate-500">
            {gradeLevel ? `${gradeLevel}. sınıf · ` : ""}Son {summary.totalAttempts} quiz denemesine dayanır
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="tap-scale flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-100"
          >
            <Printer className="size-3.5" />
            <span>Yazdır / PDF</span>
          </button>
          <Link
            href="/teacher/lessons"
            className="tap-scale flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 px-4 py-2.5 text-xs font-black text-white shadow-md hover:brightness-105"
          >
            <GraduationCap className="size-3.5" />
            <span>Özel Ders Talep Et</span>
          </Link>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 text-xs font-bold print:hidden" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-xl px-4 py-2 transition-colors ${
              activeTab === tab.id ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={<BookOpen className="size-4" />} tone="text-indigo-600" label="Çözülen Soru" value={String(summary.totalQuestions)} />
            <StatCard
              icon={<Sparkles className="size-4" />}
              tone="text-emerald-600"
              label="Doğruluk"
              value={summary.accuracy === null ? "—" : `%${summary.accuracy}`}
            />
            <StatCard icon={<Award className="size-4" />} tone="text-amber-600" label="Toplam Puan" value={String(totalPoints)} />
            <StatCard
              icon={summary.weeklyTrendPercent !== null && summary.weeklyTrendPercent < 0 ? <TrendingDown className="size-4" /> : <TrendingUp className="size-4" />}
              tone="text-rose-600"
              label="Bu Hafta Quiz"
              value={String(summary.last7DaysAttempts)}
              hint={
                summary.weeklyTrendPercent === null
                  ? "Karşılaştırma için yeterli veri yok"
                  : `Geçen haftaya göre ${summary.weeklyTrendPercent >= 0 ? "+" : ""}%${summary.weeklyTrendPercent}`
              }
            />
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
            <p className="mb-1 text-xs font-black text-indigo-900">Haftalık Özet</p>
            <p className="text-xs font-semibold leading-relaxed text-indigo-950">{digest}</p>
          </div>
        </div>
      )}

      {activeTab === "quizzes" && (
        <div className="mt-5 space-y-3">
          {summary.quizInsights.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs font-semibold text-slate-500">
              Henüz değerlendirilecek quiz sonucu yok.
            </p>
          ) : (
            summary.quizInsights.map((quiz) => (
              <div key={quiz.quizTitle} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-black text-slate-900">{quiz.quizTitle}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-black ${LEVEL_PILL[quiz.level]}`}>
                      {LEVEL_LABEL[quiz.level]}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs font-black text-slate-700">
                    %{quiz.accuracy} · {quiz.attempts} deneme
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full rounded-full ${LEVEL_BAR[quiz.level]}`} style={{ width: `${quiz.accuracy}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "screen_time" && (
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-black text-emerald-800">
              <ShieldCheck className="size-4" />
              <span>Zigo Oyun Salonu Koruması</span>
            </div>
            <ul className="space-y-1 text-xs font-semibold leading-relaxed text-emerald-900">
              <li>• Oyun salonu yalnızca Zigo Plus abonelerine açıktır.</li>
              <li>• Günlük üst sınır 120 dakikadır.</li>
              <li>• 22:00 – 08:00 arası oyunlar otomatik olarak kilitlenir.</li>
              <li>• Uygulamada reklam bulunmaz.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  tone: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className={`mb-1 flex items-center gap-2 ${tone}`}>
        {icon}
        <span className="text-[0.7rem] font-black uppercase">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      {hint ? <p className="mt-0.5 text-[0.65rem] font-bold text-slate-500">{hint}</p> : null}
    </div>
  );
}
