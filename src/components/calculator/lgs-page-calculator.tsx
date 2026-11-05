"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import {
  calculateLgsScore,
  calcLgsNet,
  DEFAULT_LGS_STATE,
  type LgsFormState,
} from "@/lib/domain/exam-score-calculator";

const LGS_PAGE_STORAGE_KEY = "zigo_exam_calc_lgs_v1";

export function LgsPageCalculator() {
  const [lgsState, setLgsState] = useState<LgsFormState>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(LGS_PAGE_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return DEFAULT_LGS_STATE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LGS_PAGE_STORAGE_KEY, JSON.stringify(lgsState));
    } catch {
      // ignore
    }
  }, [lgsState]);

  const triggerHaptic = (pattern: number | number[] = 15) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore
      }
    }
  };

  const lgsResult = useMemo(() => calculateLgsScore(lgsState), [lgsState]);

  const handleReset = () => {
    triggerHaptic([30, 40]);
    if (window.confirm("LGS netlerini sıfırlamak istediğine emin misin?")) {
      setLgsState(DEFAULT_LGS_STATE);
    }
  };

  const updateSubject = (
    key: keyof LgsFormState,
    field: "correct" | "wrong",
    val: number,
    max: number
  ) => {
    triggerHaptic(10);
    const num = Math.max(0, Math.min(max, val || 0));
    setLgsState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: num,
      },
    }));
  };

  const subjects = [
    { key: "turkce" as const, label: "Türkçe", max: 20, icon: "📖", katsayi: "4 Kat Katsayı", color: "text-blue-600 bg-blue-50" },
    { key: "matematik" as const, label: "Matematik", max: 20, icon: "📐", katsayi: "4 Kat Katsayı", color: "text-purple-600 bg-purple-50" },
    { key: "fen" as const, label: "Fen Bilimleri", max: 20, icon: "🔬", katsayi: "4 Kat Katsayı", color: "text-emerald-600 bg-emerald-50" },
    { key: "inkilap" as const, label: "T.C. İnkılap Tarihi ve Atatürkçülük", max: 10, icon: "🇹🇷", katsayi: "1 Kat Katsayı", color: "text-red-600 bg-red-50" },
    { key: "din" as const, label: "Din Kültürü ve Ahlak Bilgisi", max: 10, icon: "🕌", katsayi: "1 Kat Katsayı", color: "text-amber-600 bg-amber-50" },
    { key: "ingilizce" as const, label: "Yabancı Dil (İngilizce)", max: 10, icon: "🇬🇧", katsayi: "1 Kat Katsayı", color: "text-sky-600 bg-sky-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Skor ve Dilim Kartı */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-800 p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-violet-200">
              <span className="inline-flex size-2 rounded-full bg-emerald-400 animate-ping" />
              <span>MEB 2026/2025 STANDART SAPMA MODELİ</span>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-4xl sm:text-6xl font-black tracking-tight tabular-nums">
                {lgsResult.puan.toFixed(3)}
              </span>
              <span className="text-lg font-bold text-violet-200">/ 500.000 Puan</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              type="button"
              className="tap-scale rounded-xl bg-white/15 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-xs border border-white/20 hover:bg-white/25 transition"
            >
              🔄 Netleri Sıfırla
            </button>
          </div>
        </div>

        {/* Metrikler Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/15">
          <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-xs border border-white/10">
            <span className="text-[10px] uppercase font-bold text-violet-200 tracking-wider">
              Genel Yüzdelik Dilim
            </span>
            <p className="mt-1 text-base sm:text-xl font-black text-white">{lgsResult.yuzdelikDilim}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-xs border border-white/10">
            <span className="text-[10px] uppercase font-bold text-violet-200 tracking-wider">
              Tahmini İl Yüzdeliği
            </span>
            <p className="mt-1 text-base sm:text-xl font-black text-white">{lgsResult.ilYuzdelikDilim}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-xs border border-white/10">
            <span className="text-[10px] uppercase font-bold text-violet-200 tracking-wider">
              Toplam Net
            </span>
            <p className="mt-1 text-base sm:text-xl font-black text-white tabular-nums">
              {lgsResult.netler.toplamNet} / 90
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur-xs border border-white/10">
            <span className="text-[10px] uppercase font-bold text-violet-200 tracking-wider">
              Toplam Doğru / Yanlış
            </span>
            <p className="mt-1 text-sm sm:text-base font-black text-white tabular-nums">
              {lgsResult.toplamDogru} D · {lgsResult.toplamYanlis} Y
            </p>
          </div>
        </div>

        {/* Hedef ve Okul Önerisi */}
        <div className="mt-4 rounded-2xl bg-white/15 p-4 backdrop-blur-xs border border-white/15 space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-black">
            <span>🎯 Hedef Analizi:</span>
            <span>{lgsResult.hedefYorumu}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-violet-200 font-medium">
            <span>🏫 Tercih Edilebilecek Liseler:</span>
            <span className="text-white font-bold">{lgsResult.tavsiyeOkullar}</span>
          </div>
        </div>
      </div>

      {/* Net Giriş Formu */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-night">LGS Ders Netlerinizi Girin</h2>
            <p className="text-xs text-slate-500 font-medium">
              MEB kuralı: 3 Yanlış 1 Doğruyu götürür. Katsayılar resmi kılavuza göredir.
            </p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {subjects.map((sub) => {
            const net = calcLgsNet(lgsState[sub.key].correct, lgsState[sub.key].wrong, sub.max);
            return (
              <div
                key={sub.key}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition rounded-xl px-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sub.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-night">{sub.label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sub.color}`}>
                        {sub.katsayi}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">
                      Toplam {sub.max} Soru · Net: <b className="text-violet-700 font-black">{net}</b>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-slate-500">Doğru:</label>
                    <input
                      type="number"
                      min={0}
                      max={sub.max}
                      value={lgsState[sub.key].correct || ""}
                      placeholder="0"
                      onChange={(e) => updateSubject(sub.key, "correct", Number(e.target.value), sub.max)}
                      className="w-16 rounded-xl border border-slate-200 bg-slate-50 py-2 px-2 text-center text-sm font-black text-night outline-none focus:bg-white focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20 transition"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-slate-500">Yanlış:</label>
                    <input
                      type="number"
                      min={0}
                      max={sub.max}
                      value={lgsState[sub.key].wrong || ""}
                      placeholder="0"
                      onChange={(e) => updateSubject(sub.key, "wrong", Number(e.target.value), sub.max)}
                      className="w-16 rounded-xl border border-slate-200 bg-slate-50 py-2 px-2 text-center text-sm font-black text-night outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resmi Portallar ve Zigo Aksiyonları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <a
          href="https://e-okul.meb.gov.tr/"
          target="_blank"
          rel="noopener noreferrer"
          className="tap-scale flex items-center justify-between rounded-2xl border border-red-200 bg-gradient-to-r from-red-500 via-rose-600 to-red-700 p-4 text-white shadow-md shadow-red-600/20 hover:brightness-105 transition"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/20 text-xl backdrop-blur-xs">
              🏫
            </span>
            <div>
              <p className="text-sm font-black">e-Okul Yönetim Bilgi Sistemi</p>
              <p className="text-xs text-red-100">Dönem notları ve devamsızlık durumu</p>
            </div>
          </div>
          <span className="text-sm font-black bg-white/20 px-2.5 py-1 rounded-lg">Aç →</span>
        </a>

        <a
          href="https://ogmmateryal.eba.gov.tr/"
          target="_blank"
          rel="noopener noreferrer"
          className="tap-scale flex items-center justify-between rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-4 text-white shadow-md shadow-emerald-600/20 hover:brightness-105 transition"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/20 text-xl backdrop-blur-xs">
              📚
            </span>
            <div>
              <p className="text-sm font-black">MEB OGM Materyal</p>
              <p className="text-xs text-emerald-100">Ders kitapları, soru havuzu ve denemeler</p>
            </div>
          </div>
          <span className="text-sm font-black bg-white/20 px-2.5 py-1 rounded-lg">Aç →</span>
        </a>
      </div>

      {/* Kayıt Ol CTA */}
      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-6 text-center space-y-3">
        <span className="text-2xl">🚀</span>
        <h3 className="text-lg font-black text-night">LGS&apos;de Hedeflediğin Liseyi Kazan!</h3>
        <p className="max-w-md mx-auto text-xs text-slate-600">
          Zigo ile doğrulanmış öğretmenlerden soru çözümü al, haftalık akademik liglerde yarış ve 7 gün ücretsiz deneme ile çalışmaya hemen başla.
        </p>
        <div className="pt-2">
          <Link
            href="/auth?redirect=/exams"
            className="tap-scale inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-600/25 hover:brightness-105 transition"
          >
            <span>Ücretsiz Başla (7 Gün Hediye)</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
