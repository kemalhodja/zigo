"use client";

import { useEffect, useMemo, useState } from "react";

import {
  calculateLgsScore,
  calculateYksScore,
  calcLgsNet,
  calcYksNet,
  DEFAULT_LGS_STATE,
  DEFAULT_YKS_STATE,
  type LgsFormState,
  type YksFormState,
} from "@/lib/domain/exam-score-calculator";

const LGS_STORAGE_KEY = "zigo_exam_calc_lgs_v1";
const YKS_STORAGE_KEY = "zigo_exam_calc_yks_v1";

export function ExamScoreCalculatorModal({
  userRole,
}: {
  userRole?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"lgs" | "yks">("lgs");

  // LGS State with Persistence
  const [lgsState, setLgsState] = useState<LgsFormState>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(LGS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return DEFAULT_LGS_STATE;
  });

  // YKS State with Persistence
  const [yksState, setYksState] = useState<YksFormState>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(YKS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...DEFAULT_YKS_STATE,
            ...parsed,
            tyt: { ...DEFAULT_YKS_STATE.tyt, ...(parsed.tyt || {}) },
            ayt: { ...DEFAULT_YKS_STATE.ayt, ...(parsed.ayt || {}) },
          };
        }
      } catch {
        // ignore
      }
    }
    return DEFAULT_YKS_STATE;
  });

  // Save LGS to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LGS_STORAGE_KEY, JSON.stringify(lgsState));
    } catch {
      // ignore
    }
  }, [lgsState]);

  // Save YKS to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(YKS_STORAGE_KEY, JSON.stringify(yksState));
    } catch {
      // ignore
    }
  }, [yksState]);

  // Haptic Feedback Helper
  const triggerHaptic = (pattern: number | number[] = 15) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore
      }
    }
  };

  // Calculations
  const lgsResult = useMemo(() => calculateLgsScore(lgsState), [lgsState]);
  const yksResult = useMemo(() => calculateYksScore(yksState), [yksState]);

  // YKS field active stream
  const [yksStream, setYksStream] = useState<"tyt" | "say" | "ea" | "soz" | "dil">("tyt");

  // Reset Handlers
  const handleResetLgs = () => {
    triggerHaptic([30, 40]);
    if (window.confirm("LGS netlerini sıfırlamak istediğine emin misin?")) {
      setLgsState(DEFAULT_LGS_STATE);
    }
  };

  const handleResetYks = () => {
    triggerHaptic([30, 40]);
    if (window.confirm("YKS netlerini sıfırlamak istediğine emin misin?")) {
      setYksState(DEFAULT_YKS_STATE);
    }
  };

  const updateLgsSubject = (
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

  return (
    <>
      {/* Profil Aksiyon Butonu */}
      <button
        onClick={() => {
          triggerHaptic(20);
          setIsOpen(true);
        }}
        className="zigo-action-chip tap-scale rounded-lg border border-violet-200 bg-gradient-to-r from-violet-50 via-purple-50 to-pink-50 text-purple-900 font-black inline-flex items-center justify-center gap-1.5 shadow-xs transition hover:border-violet-300 hover:from-violet-100 hover:to-pink-100"
        type="button"
        title="LGS & YKS Puan Hesaplama Robotu"
      >
        <span>🧮</span>
        <span>LGS & YKS Hesapla</span>
      </button>

      {/* Hesaplama Modalı */}
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex flex-col items-center justify-start sm:justify-center overflow-y-auto bg-black/60 p-2 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl shrink-0 my-auto rounded-3xl bg-white shadow-2xl text-night border border-slate-100 overflow-hidden">
            {/* Modal Başlığı */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white text-base shadow-sm">
                  🧮
                </span>
                <div>
                  <h3 className="text-base font-black text-night leading-tight">
                    Sınav Puanı Hesaplama Robotu
                  </h3>
                  <p className="text-[11px] font-bold text-slate-500">
                    MEB & ÖSYM güncel standart katsayıları ile
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex size-8 items-center justify-center rounded-full bg-slate-200/60 text-slate-600 hover:bg-slate-200 hover:text-night transition text-sm font-black"
                type="button"
                aria-label="Kapat"
              >
                ✕
              </button>
            </div>

            {/* Sınav Türü Seçimi (LGS vs YKS) */}
            <div className="flex border-b border-slate-200 bg-slate-100/60 p-1.5 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  setActiveTab("lgs");
                }}
                className={`flex-1 rounded-xl py-2.5 text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "lgs"
                    ? "bg-white text-violet-700 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>🎒</span>
                <span>LGS (8. Sınıf)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  setActiveTab("yks");
                }}
                className={`flex-1 rounded-xl py-2.5 text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "yks"
                    ? "bg-white text-indigo-700 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>🎓</span>
                <span>YKS (TYT - AYT - YDT)</span>
              </button>
            </div>

            {/* Modal Gövdesi */}
            <div className="max-h-[75vh] overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* === LGS TAB === */}
              {activeTab === "lgs" && (
                <div className="space-y-4">
                  {/* LGS Skor Kartı */}
                  <div className="rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-4 sm:p-5 text-white shadow-lg shadow-violet-600/20">
                    <div className="flex items-center justify-between text-xs font-bold text-violet-200 mb-1">
                      <span>TAHMİNİ LGS PUANI</span>
                      <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] text-white">
                        Maks. 500
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black tracking-tight">
                        {lgsResult.puan.toFixed(3)}
                      </span>
                      <span className="text-sm font-semibold text-violet-200">/ 500.000</span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-white/15">
                      <div className="rounded-xl bg-white/10 p-2 backdrop-blur-xs">
                        <span className="text-[10px] uppercase font-bold text-violet-200">
                          Genel Yüzdelik
                        </span>
                        <p className="text-xs sm:text-sm font-black text-white">{lgsResult.yuzdelikDilim}</p>
                      </div>
                      <div className="rounded-xl bg-white/10 p-2 backdrop-blur-xs">
                        <span className="text-[10px] uppercase font-bold text-violet-200">
                          Tahmini İl Yüzdeliği
                        </span>
                        <p className="text-xs sm:text-sm font-black text-white">{lgsResult.ilYuzdelikDilim}</p>
                      </div>
                      <div className="rounded-xl bg-white/10 p-2 backdrop-blur-xs col-span-2 sm:col-span-1">
                        <span className="text-[10px] uppercase font-bold text-violet-200">
                          Toplam Net
                        </span>
                        <p className="text-xs sm:text-sm font-black text-white">
                          {lgsResult.netler.toplamNet} / 90
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 rounded-xl bg-white/15 p-2.5 text-xs text-violet-100 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span>🎯 Hedef:</span>
                        <span>{lgsResult.hedefYorumu}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-violet-200">
                        <span>🏫</span>
                        <span className="truncate">{lgsResult.tavsiyeOkullar}</span>
                      </div>
                    </div>
                  </div>

                  {/* LGS Ders Girişleri */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                        Ders Netleri (3 Yanlış 1 Doğruyu Götürür)
                      </h4>
                      <button
                        onClick={handleResetLgs}
                        type="button"
                        className="text-xs font-bold text-rose-600 hover:text-rose-700"
                      >
                        Temizle
                      </button>
                    </div>

                    {[
                      { key: "turkce" as const, label: "Türkçe", max: 20, icon: "📖", katsayi: "4 Kat" },
                      { key: "matematik" as const, label: "Matematik", max: 20, icon: "📐", katsayi: "4 Kat" },
                      { key: "fen" as const, label: "Fen Bilimleri", max: 20, icon: "🔬", katsayi: "4 Kat" },
                      { key: "inkilap" as const, label: "İnkılap Tarihi", max: 10, icon: "🇹🇷", katsayi: "1 Kat" },
                      { key: "din" as const, label: "Din Kültürü", max: 10, icon: "🕌", katsayi: "1 Kat" },
                      { key: "ingilizce" as const, label: "Yabancı Dil (İngilizce)", max: 10, icon: "🇬🇧", katsayi: "1 Kat" },
                    ].map((item) => {
                      const net = calcLgsNet(
                        lgsState[item.key].correct,
                        lgsState[item.key].wrong,
                        item.max
                      );
                      return (
                        <div
                          key={item.key}
                          className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3 gap-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{item.icon}</span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-night">{item.label}</span>
                                <span className="text-[10px] font-bold text-violet-600 bg-violet-100/60 px-1.5 py-0.2 rounded">
                                  {item.katsayi}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-500">
                                {item.max} Soru · Net: <b className="text-night">{net}</b>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-slate-500">D:</span>
                              <input
                                type="number"
                                min={0}
                                max={item.max}
                                value={lgsState[item.key].correct || ""}
                                placeholder="0"
                                onChange={(e) =>
                                  updateLgsSubject(item.key, "correct", Number(e.target.value), item.max)
                                }
                                className="w-14 rounded-lg border border-slate-300 bg-white py-1.5 px-2 text-center text-xs font-black text-night outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-slate-500">Y:</span>
                              <input
                                type="number"
                                min={0}
                                max={item.max}
                                value={lgsState[item.key].wrong || ""}
                                placeholder="0"
                                onChange={(e) =>
                                  updateLgsSubject(item.key, "wrong", Number(e.target.value), item.max)
                                }
                                className="w-14 rounded-lg border border-slate-300 bg-white py-1.5 px-2 text-center text-xs font-black text-night outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* === YKS TAB === */}
              {activeTab === "yks" && (
                <div className="space-y-4">
                  {/* OBP (Okul Puanı) Kartı */}
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">📜</span>
                        <h4 className="text-xs font-black text-indigo-950">
                          Diploma Notu & OBP (Okul Puanı)
                        </h4>
                      </div>
                      <span className="text-xs font-black text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-indigo-200">
                        +{yksResult.obpKatki} Yerleştirme Puanı
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                        <label className="text-[11px] font-bold text-slate-600 whitespace-nowrap">
                          Diploma Notu (50-100):
                        </label>
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
                          className="w-16 rounded-lg border border-indigo-200 bg-white py-1 px-2 text-center text-xs font-black text-night outline-none focus:border-indigo-600"
                        />
                      </div>

                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={yksState.kirikObp}
                          onChange={(e) => {
                            triggerHaptic(15);
                            setYksState((prev) => ({ ...prev, kirikObp: e.target.checked }));
                          }}
                          className="size-3.5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Kırık OBP (Önceki yıl yerleştim)</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={Boolean(yksState.meslekLisesiEkPuan)}
                          onChange={(e) => {
                            triggerHaptic(15);
                            setYksState((prev) => ({ ...prev, meslekLisesiEkPuan: e.target.checked }));
                          }}
                          className="size-3.5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Meslek Lisesi Ek Puanı (+0.06 OBP)</span>
                      </label>
                    </div>
                  </div>

                  {/* TYT 0.5 Net Kuralı Uyarı Bandı */}
                  {!yksResult.tyt.isCalculable && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 font-medium">
                      ⚠️ <b>ÖSYM Kuralı:</b> TYT puanının hesaplanabilmesi için Türkçe veya Temel Matematik testinden en az 0.5 ham net yapılmalıdır.
                    </div>
                  )}

                  {/* YKS Alan Seçici (TYT, SAY, EA, SÖZ, DİL) */}
                  <div className="grid grid-cols-5 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-black">
                    {(
                      [
                        { id: "tyt" as const, label: "TYT" },
                        { id: "say" as const, label: "SAY" },
                        { id: "ea" as const, label: "EA" },
                        { id: "soz" as const, label: "SÖZ" },
                        { id: "dil" as const, label: "DİL" },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic(15);
                          setYksStream(t.id);
                        }}
                        className={`py-2 rounded-lg transition text-center text-[11px] font-bold ${
                          yksStream === t.id
                            ? "bg-white text-indigo-700 shadow-sm"
                            : "text-slate-600 hover:text-night"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Seçili YKS Skor Kartı */}
                  {(() => {
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

                    const streamLabel =
                      yksStream === "tyt"
                        ? "TYT (ÖNLİSANS & POLİSLİK)"
                        : yksStream === "say"
                          ? "SAYISAL (SAY)"
                          : yksStream === "ea"
                            ? "EŞİT AĞIRLIK (EA)"
                            : yksStream === "soz"
                              ? "SÖZEL (SÖZ)"
                              : "YABANCI DİL (DİL)";

                    return (
                      <div className="rounded-2xl bg-gradient-to-br from-indigo-700 via-blue-700 to-sky-700 p-4 sm:p-5 text-white shadow-lg shadow-indigo-700/20">
                        <div className="flex items-center justify-between text-xs font-bold text-indigo-200 mb-1">
                          <span>{streamLabel} PUAN VE SIRALAMA</span>
                          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] text-white">
                            TYT Net: {yksResult.tyt.toplamNet}
                          </span>
                        </div>

                        {!currentScore.isCalculable ? (
                          <div className="rounded-xl bg-amber-500/20 border border-amber-300/30 p-3 my-2 text-xs text-amber-100">
                            <p className="font-bold">⚠️ Puan Hesaplanamadı (0.5 Net Kuralı)</p>
                            <p className="text-[11px] opacity-90 mt-0.5">{currentScore.uncalculatedReason}</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-baseline gap-3">
                              <div>
                                <span className="text-xs uppercase font-bold text-indigo-200 block">
                                  Yerleştirme Puanı (+OBP)
                                </span>
                                <span className="text-3xl font-black">
                                  {currentScore.yerlestirmePuani.toFixed(2)}
                                </span>
                              </div>
                              <div className="border-l border-white/20 pl-3">
                                <span className="text-[10px] uppercase font-bold text-indigo-200 block">
                                  Ham Puan
                                </span>
                                <span className="text-lg font-black text-indigo-100">
                                  {currentScore.hamPuan.toFixed(2)}
                                </span>
                              </div>
                              {currentScore.ekPuanliYerlestirme && (
                                <div className="border-l border-white/20 pl-3">
                                  <span className="text-[10px] uppercase font-bold text-amber-200 block">
                                    Ek Puanlı (+0.06)
                                  </span>
                                  <span className="text-lg font-black text-amber-300">
                                    {currentScore.ekPuanliYerlestirme.toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="mt-3 pt-3 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <span className="text-xs font-bold text-indigo-200">
                                Tahmini Başarı Sırası:
                              </span>
                              <span className="rounded-lg bg-white/20 px-2.5 py-1 text-xs font-black text-white backdrop-blur-xs self-start sm:self-auto">
                                🎯 {currentScore.tahminiSiralama}
                              </span>
                            </div>

                            {currentScore.ornekBolumler && (
                              <div className="mt-2 pt-2 border-t border-white/10 text-[11px] text-indigo-100 flex items-start gap-1.5">
                                <span className="shrink-0 font-bold">🎓 Hedef Bölümler:</span>
                                <span>{currentScore.ornekBolumler}</span>
                              </div>
                            )}

                            <div className="mt-3 pt-2.5 border-t border-white/15 flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold text-indigo-200">
                                Resmi kaynaklar & tercih:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <a
                                  href="https://yokatlas.yok.gov.tr/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-lg bg-white/20 hover:bg-white/30 px-2.5 py-1 text-[11px] font-black text-white backdrop-blur-xs border border-white/25 transition inline-flex items-center gap-1 shrink-0"
                                >
                                  <span>🗺️ YÖK Atlas</span>
                                </a>
                                <a
                                  href="https://ogmmateryal.eba.gov.tr/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-lg bg-white/20 hover:bg-white/30 px-2.5 py-1 text-[11px] font-black text-white backdrop-blur-xs border border-white/25 transition inline-flex items-center gap-1 shrink-0"
                                >
                                  <span>📚 OGM Materyal</span>
                                </a>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between px-1 pt-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                      1. Oturum: TYT (Temel Yeterlilik Testi)
                    </h4>
                    <button
                      onClick={handleResetYks}
                      type="button"
                      className="text-xs font-bold text-rose-600 hover:text-rose-700"
                    >
                      Tümünü Temizle
                    </button>
                  </div>

                  {/* TYT Dersleri */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: "turkce" as const, label: "TYT Türkçe", max: 40, icon: "📖" },
                      { key: "sosyal" as const, label: "TYT Sosyal", max: 20, icon: "🌍" },
                      { key: "matematik" as const, label: "TYT Temel Matematik", max: 40, icon: "📐" },
                      { key: "fen" as const, label: "TYT Fen Bilimleri", max: 20, icon: "🔬" },
                    ].map((item) => {
                      const net = calcYksNet(
                        yksState.tyt[item.key].correct,
                        yksState.tyt[item.key].wrong,
                        item.max
                      );
                      return (
                        <div
                          key={item.key}
                          className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 gap-2"
                        >
                          <div>
                            <p className="text-xs font-black text-night flex items-center gap-1">
                              <span>{item.icon}</span>
                              <span>{item.label}</span>
                            </p>
                            <p className="text-[10px] font-bold text-slate-500">
                              {item.max} Soru · Net: <b className="text-night">{net}</b>
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              max={item.max}
                              value={yksState.tyt[item.key].correct || ""}
                              placeholder="D"
                              onChange={(e) =>
                                updateTytSubject(item.key, "correct", Number(e.target.value), item.max)
                              }
                              className="w-11 rounded-lg border border-slate-300 bg-white py-1 px-1 text-center text-xs font-black text-night outline-none focus:border-indigo-600"
                            />
                            <input
                              type="number"
                              min={0}
                              max={item.max}
                              value={yksState.tyt[item.key].wrong || ""}
                              placeholder="Y"
                              onChange={(e) =>
                                updateTytSubject(item.key, "wrong", Number(e.target.value), item.max)
                              }
                              className="w-11 rounded-lg border border-slate-300 bg-white py-1 px-1 text-center text-xs font-black text-night outline-none focus:border-rose-600"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 2. Oturum: AYT Dersleri */}
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 pt-2 px-1">
                    2. Oturum: AYT & YDT Dersleri
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: "matematik" as const, label: "AYT Matematik", max: 40, icon: "📐" },
                      { key: "fizik" as const, label: "AYT Fizik", max: 14, icon: "⚡" },
                      { key: "kimya" as const, label: "AYT Kimya", max: 13, icon: "🧪" },
                      { key: "biyoloji" as const, label: "AYT Biyoloji", max: 13, icon: "🧬" },
                      { key: "edebiyat" as const, label: "AYT Edebiyat", max: 24, icon: "📜" },
                      { key: "tarih1" as const, label: "AYT Tarih-1", max: 10, icon: "🏛️" },
                      { key: "cografya1" as const, label: "AYT Coğrafya-1", max: 6, icon: "🗺️" },
                      { key: "tarih2" as const, label: "AYT Tarih-2", max: 11, icon: "🏰" },
                      { key: "cografya2" as const, label: "AYT Coğrafya-2", max: 11, icon: "🌋" },
                      { key: "felsefe" as const, label: "AYT Felsefe Grubu", max: 12, icon: "🤔" },
                      { key: "din" as const, label: "AYT Din Kültürü", max: 6, icon: "🕌" },
                      { key: "ydt" as const, label: "YDT Yabancı Dil", max: 80, icon: "🌐" },
                    ].map((item) => {
                      const net = calcYksNet(
                        yksState.ayt[item.key].correct,
                        yksState.ayt[item.key].wrong,
                        item.max
                      );
                      return (
                        <div
                          key={item.key}
                          className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 gap-2"
                        >
                          <div>
                            <p className="text-xs font-black text-night flex items-center gap-1">
                              <span>{item.icon}</span>
                              <span>{item.label}</span>
                            </p>
                            <p className="text-[10px] font-bold text-slate-500">
                              {item.max} Soru · Net: <b className="text-night">{net}</b>
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              max={item.max}
                              value={yksState.ayt[item.key].correct || ""}
                              placeholder="D"
                              onChange={(e) =>
                                updateAytSubject(item.key, "correct", Number(e.target.value), item.max)
                              }
                              className="w-11 rounded-lg border border-slate-300 bg-white py-1 px-1 text-center text-xs font-black text-night outline-none focus:border-indigo-600"
                            />
                            <input
                              type="number"
                              min={0}
                              max={item.max}
                              value={yksState.ayt[item.key].wrong || ""}
                              placeholder="Y"
                              onChange={(e) =>
                                updateAytSubject(item.key, "wrong", Number(e.target.value), item.max)
                              }
                              className="w-11 rounded-lg border border-slate-300 bg-white py-1 px-1 text-center text-xs font-black text-night outline-none focus:border-rose-600"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Alt Aksiyon */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-5 py-3">
              <span className="text-[11px] font-bold text-slate-500">
                💾 İlerlemeniz cihazınızda otomatik saklanır
              </span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  setIsOpen(false);
                }}
                className="rounded-xl bg-night px-4 py-2 text-xs font-black text-white hover:bg-slate-800 transition"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Profil sayfasında kart olarak da görüntülenebilen özet hesaplama banner'ı
 */
export function ExamScoreCalculatorBanner({
  onOpenModal,
}: {
  onOpenModal?: () => void;
}) {
  return (
    <div className="mt-4 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-4 text-white shadow-md shadow-violet-600/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-2xl backdrop-blur-xs border border-white/20">
            🧮
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black tracking-wider uppercase text-violet-200">
                Puan & Sıralama Robotu
              </span>
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h4 className="text-sm font-black text-white leading-tight">
              LGS ve YKS Puan Hesaplama
            </h4>
            <p className="text-[11px] font-medium text-violet-100/90 leading-tight">
              Güncel MEB & ÖSYM standart katsayıları ve tahmini yüzdelik dilim
            </p>
          </div>
        </div>

        <button
          onClick={onOpenModal}
          type="button"
          className="tap-scale flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-black text-violet-900 shadow-sm hover:bg-violet-50 transition shrink-0"
        >
          <span>Hesapla</span>
          <svg
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

