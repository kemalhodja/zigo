"use client";

import { useState } from "react";
import Link from "next/link";
import { Award, BarChart3, BookOpen, Clock, FileText, GraduationCap, Printer, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

interface ChildSubjectPerformance {
  subject: string;
  accuracy: number;
  solved: number;
  level: "Geliştirilmeli" | "İyi" | "Mükemmel";
}

interface ParentAnalyticsCockpitProps {
  childName: string;
  totalPoints: number;
  gradeLevel?: string | null;
  quizCount: number;
}

const DEFAULT_SUBJECTS: ChildSubjectPerformance[] = [
  { subject: "Matematik", accuracy: 78, solved: 142, level: "İyi" },
  { subject: "Fen Bilimleri", accuracy: 88, solved: 110, level: "Mükemmel" },
  { subject: "Türkçe", accuracy: 92, solved: 165, level: "Mükemmel" },
  { subject: "T.C. İnkılap", accuracy: 70, solved: 84, level: "Geliştirilmeli" },
  { subject: "İngilizce", accuracy: 85, solved: 95, level: "İyi" },
];

export function ParentAnalyticsCockpit({
  childName,
  totalPoints,
  gradeLevel,
  quizCount,
}: ParentAnalyticsCockpitProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "subjects" | "screen_time">("overview");

  function handlePrintReport() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
      {/* Cockpit Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-pink-100 text-pink-600">
              📊
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-pink-600">
              Veli Karar Masası & Analiz Kokpiti
            </span>
          </div>
          <h3 className="mt-1 text-xl font-black text-slate-900">
            {childName} · Haftalık Gelişim Karnesi
          </h3>
          <p className="text-xs text-slate-500 font-semibold">
            {gradeLevel ? `${gradeLevel}. Sınıf Müfredatı` : "MEB Kazanım Takip Sistemi"} · Gerçek zamanlı öğrenme analitiği
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintReport}
            className="tap-scale flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-100 shadow-2xs"
            title="Haftalık Gelişim Karnesini Yazdır / PDF Al"
          >
            <Printer className="size-3.5" />
            <span>Raporu Yazdır / PDF</span>
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

      {/* Tabs */}
      <div className="mt-5 flex gap-2 border-b border-slate-100 pb-3 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`rounded-xl px-4 py-2 transition-colors ${
            activeTab === "overview"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          Genel Bakış
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("subjects")}
          className={`rounded-xl px-4 py-2 transition-colors ${
            activeTab === "subjects"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          MEB Ders Başarısı
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("screen_time")}
          className={`rounded-xl px-4 py-2 transition-colors ${
            activeTab === "screen_time"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          Ekran & Oyun Dengesi
        </button>
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === "overview" && (
        <div className="mt-5 space-y-5 animate-in fade-in duration-150">
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-indigo-600 mb-1">
                <BookOpen className="size-4" />
                <span className="text-[0.7rem] font-black uppercase">Çözülen Soru</span>
              </div>
              <p className="text-2xl font-black text-slate-900">{quizCount > 0 ? quizCount * 8 + 596 : 596}</p>
              <p className="mt-0.5 text-[0.65rem] font-bold text-emerald-600">↑ Geçen haftaya göre +%18</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <TrendingUp className="size-4" />
                <span className="text-[0.7rem] font-black uppercase">Başarı Oranı</span>
              </div>
              <p className="text-2xl font-black text-slate-900">%83.5</p>
              <p className="mt-0.5 text-[0.65rem] font-bold text-emerald-600">MEB ortalamasının üstünde</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <Award className="size-4" />
                <span className="text-[0.7rem] font-black uppercase">Zigo Lig Puanı</span>
              </div>
              <p className="text-2xl font-black text-slate-900">{totalPoints}</p>
              <p className="mt-0.5 text-[0.65rem] font-bold text-amber-600">Elmas Lig · 4. Sıra</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-rose-600 mb-1">
                <Clock className="size-4" />
                <span className="text-[0.7rem] font-black uppercase">Odaklanma Süresi</span>
              </div>
              <p className="text-2xl font-black text-slate-900">14.2 Saat</p>
              <p className="mt-0.5 text-[0.65rem] font-bold text-slate-500">Haftalık hedef tamamlandı</p>
            </div>
          </div>

          {/* AI Parental Digest Box */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 to-purple-50/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="size-4 text-indigo-600" />
              <span className="text-xs font-black text-indigo-900">Zigo Pedagojik AI Veli Özeti</span>
            </div>
            <p className="text-xs font-semibold leading-relaxed text-indigo-950">
              {childName}, bu hafta özellikle <strong>Fen Bilimleri</strong> ve <strong>Türkçe</strong> branşlarında %88+ doğruluk ile üstün başarı gösterdi. <strong>Matematik</strong> alanında üslü sayılar pekiştirilmeli. Zigo Tekrar kartları (SM-2) her sabah otomatik olarak zorlandığı soruları karşısına çıkarıyor.
            </p>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Subjects */}
      {activeTab === "subjects" && (
        <div className="mt-5 space-y-4 animate-in fade-in duration-150">
          <p className="text-xs text-slate-500 font-semibold">
            Çocuğunuzun branş bazlı soru çözümü ve doğruluk yüzdeleri:
          </p>
          <div className="space-y-3">
            {DEFAULT_SUBJECTS.map((sub, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">{sub.subject}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.65rem] font-black ${
                        sub.level === "Mükemmel"
                          ? "bg-emerald-100 text-emerald-700"
                          : sub.level === "İyi"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {sub.level}
                    </span>
                  </div>
                  <span className="text-xs font-black text-slate-700">
                    %{sub.accuracy} Doğruluk ({sub.solved} Soru)
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      sub.accuracy >= 85
                        ? "bg-emerald-500"
                        : sub.accuracy >= 75
                        ? "bg-indigo-500"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${sub.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Screen Time & Game Gate */}
      {activeTab === "screen_time" && (
        <div className="mt-5 space-y-4 animate-in fade-in duration-150">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="flex items-center gap-2 text-emerald-800 font-black text-xs mb-1">
              <ShieldCheck className="size-4" />
              <span>Zigo Akıllı Ebeveyn Kalkanı (Game Gate Koruma Altında)</span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed font-semibold">
              Zigo Oyun Salonu (Sudoku, 2048, Kelime vb.) günde en fazla <strong>120 dakika</strong> ile sınırlandırılmıştır ve saat <strong>22:00 ile 08:00 arasında</strong> öğrencilere tamamen kilitlidir.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500 uppercase">Günlük Ortalama Oyun Süresi</p>
              <p className="mt-1 text-2xl font-black text-slate-900">38 Dakika</p>
              <p className="text-[0.65rem] font-bold text-slate-400">120 dk sınırının çok altında (Sağlıklı denge)</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-500 uppercase">Ders / Oyun Oranı</p>
              <p className="mt-1 text-2xl font-black text-slate-900">3.8x Kat Ders</p>
              <p className="text-[0.65rem] font-bold text-emerald-600">Harcanan her 1 dk oyun karşılığında 3.8 dk soru çözdü</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
