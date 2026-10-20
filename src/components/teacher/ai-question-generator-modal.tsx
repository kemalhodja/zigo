"use client";

import { useState } from "react";
import { Bot, Sparkles, X, Check, Loader2, AlertCircle, PlusCircle, RefreshCw } from "lucide-react";
import type { DraftQuestion, QuestionFormat } from "@/app/quizzes/create/page";

interface AiQuestionGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionsGenerated: (questions: DraftQuestion[], mode: "append" | "replace") => void;
  currentCount: number;
}

export function AiQuestionGeneratorModal({
  isOpen,
  onClose,
  onQuestionsGenerated,
  currentCount,
}: AiQuestionGeneratorModalProps) {
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("8. Sınıf LGS");
  const [format, setFormat] = useState<QuestionFormat>("lgs_4");
  const [count, setCount] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<DraftQuestion[] | null>(null);

  if (!isOpen) return null;

  function triggerHaptic(type: "click" | "success" | "warn" = "click") {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      if (type === "click") navigator.vibrate(10);
      else if (type === "success") navigator.vibrate([15, 30, 20]);
      else if (type === "warn") navigator.vibrate([30, 30, 30]);
    }
  }

  async function handleGenerate() {
    if (!topic.trim() || topic.trim().length < 3) {
      setError("Lütfen en az 3 karakterden oluşan bir konu veya kazanım girin.");
      triggerHaptic("warn");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedPreview(null);
    triggerHaptic("click");

    try {
      const res = await fetch("/api/teacher/ai-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          grade,
          count,
          format,
          language: "tr",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Sorular üretilirken bir hata oluştu.");
      }

      const mapped: DraftQuestion[] = (data.questions || []).map((q: any) => ({
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex ?? 0,
        type: format === "true_false" ? "true_false" : "multiple_choice",
        difficulty: "medium",
        explanation: q.explanation || "",
      }));

      setGeneratedPreview(mapped);
      triggerHaptic("success");
    } catch (err: any) {
      setError(err.message || "Bağlantı hatası oluştu.");
      triggerHaptic("warn");
    } finally {
      setLoading(false);
    }
  }

  function handleApply(mode: "append" | "replace") {
    if (!generatedPreview || generatedPreview.length === 0) return;
    triggerHaptic("success");
    onQuestionsGenerated(generatedPreview, mode);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-indigo-50 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur border border-white/20">
              <Bot className="size-5 text-indigo-200" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black">AI Soru & Test Üreteci</h3>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[0.62rem] font-bold text-emerald-300 border border-emerald-500/30">
                  MEB Uyumlu
                </span>
              </div>
              <p className="text-xs text-indigo-200">
                Kazanım konusunu yazın, yapay zekâ saniyeler içinde şıklı sorular hazırlasın.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {!generatedPreview ? (
            <div className="space-y-4">
              {/* Konu Input */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-600">
                  Ders Konusu veya Kazanım Başlığı *
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Örn: Kareköklü İfadeler, I. Dünya Savaşı Nedenleri, Fotosentez..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition"
                    maxLength={150}
                  />
                  <span className="absolute right-3.5 top-3.5 text-[0.68rem] font-semibold text-slate-400">
                    {topic.length}/150
                  </span>
                </div>
              </div>

              {/* Sınıf & Format Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600">
                    Sınıf / Seviye
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  >
                    <option value="İlkokul (3-4. Sınıf)">İlkokul (3-4. Sınıf)</option>
                    <option value="5. Sınıf">5. Sınıf</option>
                    <option value="6. Sınıf">6. Sınıf</option>
                    <option value="7. Sınıf">7. Sınıf</option>
                    <option value="8. Sınıf LGS">8. Sınıf LGS</option>
                    <option value="9. Sınıf">9. Sınıf</option>
                    <option value="10. Sınıf">10. Sınıf</option>
                    <option value="11. Sınıf">11. Sınıf</option>
                    <option value="12. Sınıf YKS / TYT">12. Sınıf YKS / TYT</option>
                    <option value="Genel Kültür">Genel Kültür / Bilgi</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600">
                    Soru Formatı
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as QuestionFormat)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  >
                    <option value="lgs_4">4 Şıklı (LGS / Standart A-D)</option>
                    <option value="yks_5">5 Şıklı (YKS / ÖSYM A-E)</option>
                    <option value="true_false">Doğru / Yanlış (2 Seçenek)</option>
                    <option value="primary_3">3 Şıklı (İlkokul A-C)</option>
                  </select>
                </div>
              </div>

              {/* Soru Sayısı Seçimi */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600">
                    Üretilecek Soru Sayısı
                  </label>
                  <span className="text-xs font-black text-indigo-600">{count} Soru</span>
                </div>
                <div className="mt-2 flex gap-2">
                  {[3, 5, 8, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setCount(num);
                        triggerHaptic("click");
                      }}
                      className={`flex-1 rounded-xl border py-2 text-xs font-black transition ${
                        count === num
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-2xs ring-2 ring-indigo-200"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {num} Soru
                    </button>
                  ))}
                </div>
              </div>

              {/* Tips Banner */}
              <div className="rounded-2xl border border-amber-200/60 bg-amber-50/60 p-3.5">
                <p className="text-[0.72rem] font-bold text-amber-900 leading-relaxed">
                  💡 <strong>İpucu:</strong> Yapay zekâ soruları MEB kazanımlarına uygun, her soruya pedagojik çözüm açıklaması ekleyerek hazırlar. Üretilen soruları taslağa aktardıktan sonra dilediğiniz gibi düzenleyebilirsiniz.
                </p>
              </div>
            </div>
          ) : (
            /* Üretilen Soruların Önizlemesi */
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-900">
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-600" />
                  <span className="text-xs font-black">
                    {generatedPreview.length} soru başarıyla üretildi!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setGeneratedPreview(null)}
                  className="flex items-center gap-1 text-[0.7rem] font-bold text-emerald-700 hover:text-emerald-900"
                >
                  <RefreshCw className="size-3" />
                  Yeniden Ayarla
                </button>
              </div>

              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {generatedPreview.map((q, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-5 items-center justify-center rounded-md bg-indigo-600 text-[0.65rem] font-black text-white">
                        {idx + 1}
                      </span>
                      <p className="text-xs font-bold text-slate-800">{q.text}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pl-7">
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={`rounded-lg px-2.5 py-1 text-[0.68rem] font-semibold border ${
                            oi === q.correctIndex
                              ? "border-emerald-400 bg-emerald-50 text-emerald-800 font-bold"
                              : "border-slate-200 bg-white text-slate-600"
                          }`}
                        >
                          {String.fromCharCode(65 + oi)}) {opt}
                          {oi === q.correctIndex && " ✓"}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <p className="pl-7 text-[0.65rem] font-medium text-slate-500 italic">
                        💡 {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
          {!generatedPreview ? (
            <button
              type="button"
              disabled={loading || !topic.trim()}
              onClick={handleGenerate}
              className="tap-scale flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-sm font-black text-white shadow-md hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Sorular Hazırlanıyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>{count} Adet MEB Sorusu Üret</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => handleApply("append")}
                className="tap-scale flex w-full sm:flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-xs font-black text-white hover:bg-indigo-700 transition"
              >
                <PlusCircle className="size-4" />
                <span>Mevcut Taslağa Ekle (+{generatedPreview.length})</span>
              </button>
              <button
                type="button"
                onClick={() => handleApply("replace")}
                className="tap-scale flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                <span>Tümünü Sıfırla & Değiştir</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
