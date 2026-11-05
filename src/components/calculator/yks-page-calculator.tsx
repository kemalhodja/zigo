"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import {
  calculateYksScore,
  calcYksNet,
  DEFAULT_YKS_STATE,
  type YksFormState,
} from "@/lib/domain/exam-score-calculator";

const YKS_PAGE_STORAGE_KEY = "zigo_exam_calc_yks_v1";

export function YksPageCalculator() {
  const [yksState, setYksState] = useState<YksFormState>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(YKS_PAGE_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return DEFAULT_YKS_STATE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(YKS_PAGE_STORAGE_KEY, JSON.stringify(yksState));
    } catch {
      // ignore
    }
  }, [yksState]);

  const triggerHaptic = (pattern: number | number[] = 15) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore
      }
    }
  };

  const yksResult = useMemo(() => calculateYksScore(yksState), [yksState]);
  const [yksStream, setYksStream] = useState<"tyt" | "say" | "ea" | "soz" | "dil">("tyt");

  const handleReset = () => {
    triggerHaptic([30, 40]);
    if (window.confirm("YKS netlerini sıfırlamak istediğine emin misin?")) {
      setYksState(DEFAULT_YKS_STATE);
    }
  };

  const updateTytSubject = (
    key: keyof YksFormState["tyt"],
    field: "correct" | "wrong",
    val: number,
    max: number
  ) => {
    triggerHaptic(10);
    const num = Math.max(0, Math.min(max, val || 0));
    setYksState((prev) => ({
      ...prev,
      tyt: {
        ...prev.tyt,
        [key]: {
          ...prev.tyt[key],
          [field]: num,
        },
      },
    }));
  };

  const updateAytSubject = (
    key: keyof YksFormState["ayt"],
    field: "correct" | "wrong",
    val: number,
    max: number
  ) => {
    triggerHaptic(10);
    const num = Math.max(0, Math.min(max, val || 0));
    setYksState((prev) => ({
      ...prev,
      ayt: {
        ...prev.ayt,
        [key]: {
          ...prev.ayt[key],
          [field]: num,
        },
      },
    }));
  };

  const currentScore =
    yksStream === "tyt"
      ? yksResult.tyt
      : yksStream === "say"
        ? yksResult.say
        : yksStream === "ea"
          ? yksResult.ea
          : yksStream === "soz"
            ? yksResult.soz
            : yksResult.dil;

  const streamNames = {
    tyt: "TYT (Önlisans & 2 Yıllık)",
    say: "AYT Sayısal (SAY)",
    ea: "AYT Eşit Ağırlık (EA)",
    soz: "AYT Sözel (SÖZ)",
    dil: "YDT Yabancı Dil (DİL)",
  };

  return (
    <div className="space-y-6">
      {/* OBP ve Diploma Notu Ayarları */}
      <div className="rounded-3xl border border-indigo-100 bg-indigo-50/70 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📜</span>
            <div>
              <h3 className="font-black text-sm sm:text-base text-indigo-950">
                Diploma Notu & Okul Başarı Puanı (OBP)
              </h3>
              <p className="text-xs text-indigo-800/80">
                Lise diploma notunuza göre hesaplanan ek yerleştirme puanı
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="rounded-xl bg-white px-3.5 py-1.5 text-xs font-black text-indigo-700 shadow-xs border border-indigo-200">
              +{yksResult.obpKatki} Yerleştirme Puanı
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-indigo-200/50">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700">Diploma Notunuz (50-100):</label>
            <input
              type="number"
              min={50}
              max={100}
              value={yksState.diplomaNotu || ""}
              placeholder="85"
              onChange={(e) => {
                triggerHaptic(10);
                const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                setYksState((prev) => ({ ...prev, diplomaNotu: val }));
              }}
              className="w-16 rounded-xl border border-indigo-300 bg-white py-1.5 px-2 text-center text-sm font-black text-night outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={yksState.kirikObp}
              onChange={(e) => {
                triggerHaptic(15);
                setYksState((prev) => ({ ...prev, kirikObp: e.target.checked }));
              }}
              className="size-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Kırık OBP (Önceki yıl üniversiteye yerleştim: 0.06 katsayı)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(yksState.meslekLisesiEkPuan)}
              onChange={(e) => {
                triggerHaptic(15);
                setYksState((prev) => ({ ...prev, meslekLisesiEkPuan: e.target.checked }));
              }}
              className="size-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Meslek Lisesi Ek Puanı (+0.06 OBP)</span>
          </label>
        </div>
      </div>

      {/* TYT 0.5 Net Kuralı Uyarısı */}
      {!yksResult.tyt.isCalculable && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 font-medium flex items-center gap-2">
          <span>⚠️</span>
          <span>
            <b>ÖSYM 0.5 Net Kuralı:</b> TYT puanınızın hesaplanabilmesi için Türkçe veya Temel Matematik testinden en az 0.5 ham net yapmanız gerekmektedir.
          </span>
        </div>
      )}

      {/* Puan Türü Seçimi Sekmeleri (TYT, SAY, EA, SÖZ, DİL) */}
      <div className="grid grid-cols-5 gap-1.5 rounded-2xl bg-slate-100 p-1.5 text-xs font-black">
        {(
          [
            { id: "tyt" as const, label: "TYT" },
            { id: "say" as const, label: "Sayısal (SAY)" },
            { id: "ea" as const, label: "Eşit Ağırlık (EA)" },
            { id: "soz" as const, label: "Sözel (SÖZ)" },
            { id: "dil" as const, label: "YDT (Dil)" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              triggerHaptic(15);
              setYksStream(t.id);
            }}
            className={`py-2.5 rounded-xl transition text-center text-xs font-bold ${
              yksStream === t.id
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200/80 font-black"
                : "text-slate-600 hover:text-night"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Seçili Puan Türü Kartı */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-purple-700 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-indigo-700/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200">
              {streamNames[yksStream]}
            </span>
            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <div>
                <span className="text-xs font-bold text-indigo-200 block">Yerleştirme Puanı (OBP Dahil)</span>
                <span className="text-4xl sm:text-6xl font-black tracking-tight tabular-nums">
                  {currentScore.isCalculable ? currentScore.yerlestirmePuani.toFixed(3) : "Hesaplanamadı"}
                </span>
              </div>
              {currentScore.isCalculable && (
                <div className="sm:ml-4 sm:pl-4 sm:border-l border-white/20">
                  <span className="text-xs font-bold text-indigo-200 block">Ham Puan</span>
                  <span className="text-xl sm:text-2xl font-black text-indigo-200 tabular-nums">
                    {currentScore.hamPuan.toFixed(3)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleReset}
            type="button"
            className="tap-scale self-start sm:self-center rounded-xl bg-white/15 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-xs border border-white/20 hover:bg-white/25 transition"
          >
            🔄 Netleri Sıfırla
          </button>
        </div>

        {currentScore.isCalculable ? (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/15">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">
                Tahmini Başarı Sıralaması
              </span>
              <p className="mt-1 text-lg sm:text-xl font-black text-white">{currentScore.tahminiSiralama}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-xs border border-white/10">
              <span className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">
                Tercih Edilebilecek Örnek Bölümler
              </span>
              <p className="mt-1 text-xs sm:text-sm font-bold text-indigo-100">{currentScore.ornekBolumler}</p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-xs text-amber-200 font-medium">
            {currentScore.uncalculatedReason || "Gerekli minimum net şartı sağlanmadı."}
          </p>
        )}
      </div>

      {/* TYT Netleri Formu */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <h3 className="text-base font-black text-night pb-3 border-b border-slate-100">
          TYT Testleri (Tüm Alanlar İçin %40 Etki)
        </h3>

        <div className="mt-4 divide-y divide-slate-100">
          {[
            { key: "turkce" as const, label: "Türkçe", max: 40, icon: "📖" },
            { key: "matematik" as const, label: "Temel Matematik", max: 40, icon: "📐" },
            { key: "sosyal" as const, label: "Sosyal Bilimler (Tarih, Coğrafya, Felsefe, Din)", max: 20, icon: "🌍" },
            { key: "fen" as const, label: "Fen Bilimleri (Fizik, Kimya, Biyoloji)", max: 20, icon: "🔬" },
          ].map((item) => {
            const net = calcYksNet(yksState.tyt[item.key].correct, yksState.tyt[item.key].wrong, item.max);
            return (
              <div
                key={item.key}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition rounded-xl px-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <span className="font-black text-sm text-night">{item.label}</span>
                    <p className="text-xs text-slate-400">
                      {item.max} Soru · Net: <b className="text-indigo-700 font-black">{net}</b>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-slate-500">D:</label>
                    <input
                      type="number"
                      min={0}
                      max={item.max}
                      value={yksState.tyt[item.key].correct || ""}
                      placeholder="0"
                      onChange={(e) => updateTytSubject(item.key, "correct", Number(e.target.value), item.max)}
                      className="w-16 rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-2 text-center text-sm font-black text-night outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-slate-500">Y:</label>
                    <input
                      type="number"
                      min={0}
                      max={item.max}
                      value={yksState.tyt[item.key].wrong || ""}
                      placeholder="0"
                      onChange={(e) => updateTytSubject(item.key, "wrong", Number(e.target.value), item.max)}
                      className="w-16 rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-2 text-center text-sm font-black text-night outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AYT Netleri Formu */}
      {yksStream !== "tyt" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <h3 className="text-base font-black text-night pb-3 border-b border-slate-100">
            {yksStream === "dil" ? "YDT Testi (%60 Etki)" : "AYT Testleri (%60 Etki)"}
          </h3>

          <div className="mt-4 divide-y divide-slate-100">
            {yksStream === "dil" ? (
              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌐</span>
                  <div>
                    <span className="font-black text-sm text-night">Yabancı Dil Testi (YDT)</span>
                    <p className="text-xs text-slate-400">
                      80 Soru · Net: <b className="text-indigo-700 font-black">{calcYksNet(yksState.ayt.ydt.correct, yksState.ayt.ydt.wrong, 80)}</b>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-slate-500">D:</label>
                    <input
                      type="number"
                      min={0}
                      max={80}
                      value={yksState.ayt.ydt.correct || ""}
                      placeholder="0"
                      onChange={(e) => updateAytSubject("ydt", "correct", Number(e.target.value), 80)}
                      className="w-16 rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-2 text-center text-sm font-black text-night outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-slate-500">Y:</label>
                    <input
                      type="number"
                      min={0}
                      max={80}
                      value={yksState.ayt.ydt.wrong || ""}
                      placeholder="0"
                      onChange={(e) => updateAytSubject("ydt", "wrong", Number(e.target.value), 80)}
                      className="w-16 rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-2 text-center text-sm font-black text-night outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              [
                { key: "matematik" as const, label: "AYT Matematik", max: 40, icon: "📐" },
                { key: "fizik" as const, label: "Fizik", max: 14, icon: "⚡" },
                { key: "kimya" as const, label: "Kimya", max: 13, icon: "🧪" },
                { key: "biyoloji" as const, label: "Biyoloji", max: 13, icon: "🧬" },
                { key: "edebiyat" as const, label: "Türk Dili ve Edebiyatı", max: 24, icon: "📚" },
                { key: "tarih1" as const, label: "Tarih-1", max: 10, icon: "🏛️" },
                { key: "cografya1" as const, label: "Coğrafya-1", max: 6, icon: "🗺️" },
              ].map((item) => {
                const net = calcYksNet(yksState.ayt[item.key].correct, yksState.ayt[item.key].wrong, item.max);
                return (
                  <div
                    key={item.key}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition rounded-xl px-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <span className="font-black text-sm text-night">{item.label}</span>
                        <p className="text-xs text-slate-400">
                          {item.max} Soru · Net: <b className="text-indigo-700 font-black">{net}</b>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-bold text-slate-500">D:</label>
                        <input
                          type="number"
                          min={0}
                          max={item.max}
                          value={yksState.ayt[item.key].correct || ""}
                          placeholder="0"
                          onChange={(e) => updateAytSubject(item.key, "correct", Number(e.target.value), item.max)}
                          className="w-16 rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-2 text-center text-sm font-black text-night outline-none focus:border-indigo-600"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-bold text-slate-500">Y:</label>
                        <input
                          type="number"
                          min={0}
                          max={item.max}
                          value={yksState.ayt[item.key].wrong || ""}
                          placeholder="0"
                          onChange={(e) => updateAytSubject(item.key, "wrong", Number(e.target.value), item.max)}
                          className="w-16 rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-2 text-center text-sm font-black text-night outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* YÖK Atlas ve OGM Materyal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <a
          href="https://yokatlas.yok.gov.tr/"
          target="_blank"
          rel="noopener noreferrer"
          className="tap-scale flex items-center justify-between rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 p-4 text-white shadow-md shadow-sky-600/20 hover:brightness-105 transition"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/20 text-xl backdrop-blur-xs">
              🗺️
            </span>
            <div>
              <p className="text-sm font-black">YÖK Atlas Tercih Robotu</p>
              <p className="text-xs text-sky-100">Üniversite taban puanları ve başarı sıraları</p>
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
              <p className="text-sm font-black">MEB OGM Materyal YKS</p>
              <p className="text-xs text-emerald-100">TYT & AYT soru bankası ve denemeler</p>
            </div>
          </div>
          <span className="text-sm font-black bg-white/20 px-2.5 py-1 rounded-lg">Aç →</span>
        </a>
      </div>

      {/* Üniversite Hazırlık CTA */}
      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-6 text-center space-y-3">
        <span className="text-2xl">🎓</span>
        <h3 className="text-lg font-black text-night">Hedefindeki Üniversite ve Bölümü Kazan!</h3>
        <p className="max-w-md mx-auto text-xs text-slate-600">
          Zigo ile branş öğretmenlerinden anında soru çözümü desteği al, odak odalarında verimli çalış ve haftalık liglerde yerini al.
        </p>
        <div className="pt-2">
          <Link
            href="/auth?redirect=/exams"
            className="tap-scale inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-600/25 hover:brightness-105 transition"
          >
            <span>Ücretsiz Başla (7 Gün Hediye)</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
