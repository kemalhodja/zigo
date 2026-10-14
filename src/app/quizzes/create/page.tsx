"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  Eye,
  Image as ImageIcon,
  Layers,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { MathFormulaHelper } from "@/components/teacher/math-formula-helper";

export type QuestionFormat = "lgs_4" | "yks_5" | "true_false" | "primary_3";
export type Difficulty = "easy" | "medium" | "hard";

export type DraftQuestion = {
  text: string;
  options: string[];
  correctIndex: number;
  type?: "multiple_choice" | "true_false";
  difficulty?: Difficulty;
  explanation?: string;
  imageUrl?: string;
};

const DRAFT_STORAGE_KEY = "zigo_teacher_quiz_draft_v2";

function createEmptyQuestion(format: QuestionFormat = "lgs_4", difficulty: Difficulty = "medium"): DraftQuestion {
  switch (format) {
    case "yks_5":
      return {
        text: "",
        options: ["", "", "", "", ""],
        correctIndex: 0,
        type: "multiple_choice",
        difficulty,
        explanation: "",
      };
    case "true_false":
      return {
        text: "",
        options: ["Doğru", "Yanlış"],
        correctIndex: 0,
        type: "true_false",
        difficulty,
        explanation: "",
      };
    case "primary_3":
      return {
        text: "",
        options: ["", "", ""],
        correctIndex: 0,
        type: "multiple_choice",
        difficulty,
        explanation: "",
      };
    case "lgs_4":
    default:
      return {
        text: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        type: "multiple_choice",
        difficulty,
        explanation: "",
      };
  }
}

const TEMPLATE_PRESETS: {
  id: QuestionFormat;
  title: string;
  badge: string;
  desc: string;
  optCount: number;
  color: string;
}[] = [
  {
    id: "lgs_4",
    title: "LGS / Standart",
    badge: "4 Seçenek (A, B, C, D)",
    desc: "MEB LGS, ortaokul ve genel kazanım testleri için standart format.",
    optCount: 4,
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "yks_5",
    title: "YKS / TYT / AYT",
    badge: "5 Seçenek (A, B, C, D, E)",
    desc: "ÖSYM üniversiteye hazırlık ve lise deneme sınavı formatı.",
    optCount: 5,
    color: "from-purple-600 to-pink-600",
  },
  {
    id: "true_false",
    title: "Doğru / Yanlış",
    badge: "2 Seçenek (D / Y)",
    desc: "Hızlı kavram pekiştirme, doğru-yanlış taramaları ve çıkış biletleri.",
    optCount: 2,
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "primary_3",
    title: "İlkokul / Temel",
    badge: "3 Seçenek (A, B, C)",
    desc: "1-4. sınıf ilkokul seviyesi için pedagojik olarak sadeleştirilmiş format.",
    optCount: 3,
    color: "from-amber-500 to-orange-600",
  },
];

export default function CreateQuizPage() {
  const router = useRouter();

  // Primary state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetGrade, setTargetGrade] = useState("Tüm Sınıflar");
  const [quizDifficulty, setQuizDifficulty] = useState<"easy" | "medium" | "hard" | "mixed">("medium");
  const [questions, setQuestions] = useState<DraftQuestion[]>([
    createEmptyQuestion("lgs_4"),
    createEmptyQuestion("lgs_4"),
    createEmptyQuestion("lgs_4"),
  ]);

  // UI state
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [previewIdx, setPreviewIdx] = useState(0);
  const [previewSelectedOpt, setPreviewSelectedOpt] = useState<number | null>(null);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [showImageInputFor, setShowImageInputFor] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [result, setResult] = useState<{ id: string; status: string } | null>(null);

  // Restore draft from localStorage (Rule 5: State Persistence)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.targetGrade) setTargetGrade(parsed.targetGrade);
        if (parsed.quizDifficulty) setQuizDifficulty(parsed.quizDifficulty);
        if (Array.isArray(parsed.questions) && parsed.questions.length >= 1) {
          setQuestions(parsed.questions);
        }
      }
    } catch {
      // Fallback silently if localStorage fails or is corrupted
    }
  }, []);

  // Auto-save draft changes to localStorage
  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          title,
          description,
          targetGrade,
          quizDifficulty,
          questions,
          savedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // Ignore quota errors
    }
  }, [title, description, targetGrade, quizDifficulty, questions]);

  useEffect(() => {
    const timer = setTimeout(saveDraft, 800);
    return () => clearTimeout(timer);
  }, [saveDraft]);

  function triggerHaptic(type: "click" | "success" | "warn" = "click") {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      if (type === "click") navigator.vibrate(8);
      else if (type === "success") navigator.vibrate([15, 40, 15]);
      else if (type === "warn") navigator.vibrate([30, 20, 30]);
    }
  }

  function clearDraft() {
    if (window.confirm("Tüm soruları sıfırlayıp baştan başlamak istediğinize emin misiniz?")) {
      triggerHaptic("warn");
      setTitle("");
      setDescription("");
      setQuestions([
        createEmptyQuestion("lgs_4"),
        createEmptyQuestion("lgs_4"),
        createEmptyQuestion("lgs_4"),
      ]);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }

  function applyPresetFormatToAll(preset: QuestionFormat) {
    triggerHaptic("click");
    setQuestions((prev) =>
      prev.map((q) => {
        if (preset === "true_false") {
          return {
            ...q,
            options: ["Doğru", "Yanlış"],
            correctIndex: Math.min(q.correctIndex, 1),
            type: "true_false",
          };
        }
        if (preset === "yks_5") {
          const newOpts = [...q.options];
          while (newOpts.length < 5) newOpts.push("");
          return {
            ...q,
            options: newOpts.slice(0, 5),
            correctIndex: Math.min(q.correctIndex, 4),
            type: "multiple_choice",
          };
        }
        if (preset === "primary_3") {
          return {
            ...q,
            options: q.options.length >= 3 ? q.options.slice(0, 3) : [...q.options, "", ""].slice(0, 3),
            correctIndex: Math.min(q.correctIndex, 2),
            type: "multiple_choice",
          };
        }
        // lgs_4
        const newOpts = [...q.options];
        while (newOpts.length < 4) newOpts.push("");
        return {
          ...q,
          options: newOpts.slice(0, 4),
          correctIndex: Math.min(q.correctIndex, 3),
          type: "multiple_choice",
        };
      }),
    );
  }

  function updateQuestion(index: number, patch: Partial<DraftQuestion>) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function setQuestionFormat(index: number, format: QuestionFormat) {
    triggerHaptic("click");
    const current = questions[index];
    if (!current) return;

    if (format === "true_false") {
      updateQuestion(index, {
        options: ["Doğru", "Yanlış"],
        correctIndex: Math.min(current.correctIndex, 1),
        type: "true_false",
      });
    } else if (format === "yks_5") {
      const opts = [...current.options];
      while (opts.length < 5) opts.push("");
      updateQuestion(index, {
        options: opts.slice(0, 5),
        correctIndex: Math.min(current.correctIndex, 4),
        type: "multiple_choice",
      });
    } else if (format === "primary_3") {
      const opts = [...current.options];
      while (opts.length < 3) opts.push("");
      updateQuestion(index, {
        options: opts.slice(0, 3),
        correctIndex: Math.min(current.correctIndex, 2),
        type: "multiple_choice",
      });
    } else {
      // lgs_4
      const opts = [...current.options];
      while (opts.length < 4) opts.push("");
      updateQuestion(index, {
        options: opts.slice(0, 4),
        correctIndex: Math.min(current.correctIndex, 3),
        type: "multiple_choice",
      });
    }
  }

  function addOptionToQuestion(index: number) {
    const q = questions[index];
    if (!q || q.options.length >= 5) return;
    triggerHaptic("click");
    updateQuestion(index, {
      options: [...q.options, ""],
    });
  }

  function removeOptionFromQuestion(index: number, optIndex: number) {
    const q = questions[index];
    if (!q || q.options.length <= 2) return;
    triggerHaptic("click");
    const updated = q.options.filter((_, i) => i !== optIndex);
    const newCorrect =
      q.correctIndex === optIndex
        ? 0
        : q.correctIndex > optIndex
          ? q.correctIndex - 1
          : q.correctIndex;
    updateQuestion(index, {
      options: updated,
      correctIndex: Math.min(newCorrect, updated.length - 1),
    });
  }

  function duplicateQuestion(index: number) {
    if (questions.length >= 10) return;
    triggerHaptic("click");
    const target = questions[index];
    if (!target) return;
    const duplicated: DraftQuestion = {
      ...target,
      options: [...target.options],
      text: `${target.text} (Kopya)`,
    };
    const nextList = [...questions];
    nextList.splice(index + 1, 0, duplicated);
    setQuestions(nextList);
    setActiveQuestionIdx(index + 1);
  }

  function moveQuestion(index: number, direction: "up" | "down") {
    triggerHaptic("click");
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    const nextList = [...questions];
    const temp = nextList[index];
    nextList[index] = nextList[targetIdx];
    nextList[targetIdx] = temp;
    setQuestions(nextList);
    setActiveQuestionIdx(targetIdx);
  }

  function deleteQuestion(index: number) {
    if (questions.length <= 3) {
      alert("Bir quiz en az 3 sorudan oluşmalıdır.");
      return;
    }
    triggerHaptic("warn");
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    setActiveQuestionIdx((prev) => Math.max(0, prev - 1));
  }

  async function submit() {
    triggerHaptic("click");
    setError(null);

    // Validation
    if (title.trim().length < 3) {
      setError("Lütfen en az 3 karakterli açıklayıcı bir başlık girin.");
      return;
    }

    if (questions.length < 3) {
      setError("Bir quizde en az 3 soru bulunmalıdır.");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q.text.trim().length < 3) {
        setError(`${i + 1}. sorunun metni çok kısa veya boş.`);
        setActiveQuestionIdx(i);
        return;
      }
      for (let oi = 0; oi < q.options.length; oi++) {
        if (!q.options[oi].trim()) {
          setError(`${i + 1}. sorunun ${String.fromCharCode(65 + oi)} seçeneği boş bırakılamaz.`);
          setActiveQuestionIdx(i);
          return;
        }
      }
      if (q.correctIndex < 0 || q.correctIndex >= q.options.length) {
        setError(`${i + 1}. sorunun doğru cevap seçimi geçersiz.`);
        setActiveQuestionIdx(i);
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/quizzes/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          targetGrade,
          difficulty: quizDifficulty,
          questions: questions.map((q) => ({
            text: q.text.trim(),
            options: q.options.map((o) => o.trim()),
            correctIndex: q.correctIndex,
            type: q.type ?? (q.options.length === 2 ? "true_false" : "multiple_choice"),
            difficulty: q.difficulty ?? "medium",
            explanation: q.explanation?.trim() || null,
            imageUrl: q.imageUrl?.trim() || null,
          })),
        }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error ?? "Quiz oluşturulamadı.");
        triggerHaptic("warn");
        return;
      }

      triggerHaptic("success");
      setResult(body.data);
      // Clean draft
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // Ignore
      }
    } catch {
      setError("Bağlantı hatası. Lütfen internetinizi kontrol edip tekrar deneyin.");
      triggerHaptic("warn");
    } finally {
      setSubmitting(false);
    }
  }

  // Success screen
  if (result) {
    const quizUrl = typeof window !== "undefined" ? `${window.location.origin}/quizzes/${result.id}` : "";
    return (
      <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-10">
        <div className="mx-auto max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-3xl text-white shadow-md">
            {result.status === "approved" ? "🎉" : "⏳"}
          </div>
          <h1 className="mt-4 text-2xl font-black text-night">
            {result.status === "approved" ? "Testiniz Yayında!" : "Test Onaya Gönderildi"}
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500 leading-relaxed">
            {result.status === "approved"
              ? "Öğretmen kimliğiniz doğrulandığı için testiniz anında yayına alındı. Bağlantıyı öğrencilerinizle paylaşabilirsiniz."
              : "Testiniz moderasyon incelemesine iletildi. Kısa süre içinde onaylanarak öğrencilere açılacak."}
          </p>

          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(quizUrl);
                setCopiedLink(true);
                triggerHaptic("success");
                setTimeout(() => setCopiedLink(false), 2500);
              }}
              className="tap-scale flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-black text-white shadow-md hover:bg-indigo-700 transition"
            >
              {copiedLink ? <Check className="size-4" /> : <Sparkles className="size-4" />}
              <span>{copiedLink ? "Bağlantı Kopyalandı!" : "🔗 Sınav Bağlantısını Kopyala"}</span>
            </button>

            <button
              type="button"
              onClick={() => router.push(`/quizzes/${result.id}`)}
              className="tap-scale flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 py-3.5 text-sm font-black text-indigo-700 hover:bg-indigo-100 transition"
            >
              <Eye className="size-4" />
              <span>Sınavı Öğrenci Olarak Çöz</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/quizzes")}
              className="tap-scale w-full rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Quiz Arena&apos;ya Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-36">
      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/quizzes")}
              className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200"
            >
              ←
            </button>
            <div>
              <h1 className="text-base font-black text-night">Öğretmen Sınav & Quiz Stüdyosu</h1>
              <p className="text-[0.68rem] font-bold text-slate-400">
                {questions.length} Soru · Zigo MEB & YKS Formatları
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("edit");
                triggerHaptic("click");
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${
                activeTab === "edit"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Edit3 className="size-3.5" />
              <span>Editör</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("preview");
                setPreviewIdx(0);
                setPreviewSelectedOpt(null);
                triggerHaptic("click");
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${
                activeTab === "preview"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Eye className="size-3.5" />
              <span>Canlı Önizleme</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 p-4">
        {activeTab === "preview" ? (
          /* ============================================================== */
          /* CANLI ÖNİZLEME (LIVE PREVIEW) MODU                              */
          /* ============================================================== */
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-indigo-50 border border-indigo-100 p-4">
              <div className="flex items-center gap-2">
                <Eye className="size-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-black text-indigo-950">Öğrenci Deneyimi Canlı Önizleme</h3>
                  <p className="text-xs font-semibold text-indigo-700">
                    Öğrencileriniz hazırladığınız soruları bu ekranda çözecek.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className="tap-scale rounded-xl bg-white border border-indigo-200 px-3 py-1.5 text-xs font-black text-indigo-700 hover:bg-indigo-50"
              >
                ✏️ Editöre Dön
              </button>
            </div>

            {/* Quiz Preview Card */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-600">
                    Soru {previewIdx + 1} / {questions.length}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {questions[previewIdx]?.difficulty === "easy"
                      ? "🟢 Kolay"
                      : questions[previewIdx]?.difficulty === "hard"
                        ? "🟣 Yeni Nesil Zor"
                        : "🔵 Orta Seviye"}
                  </span>
                </div>
                <div className="flex gap-1">
                  {questions.map((_, qIdx) => (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => {
                        setPreviewIdx(qIdx);
                        setPreviewSelectedOpt(null);
                      }}
                      className={`size-7 rounded-lg text-xs font-black transition ${
                        previewIdx === qIdx
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {qIdx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Text & Image */}
              <div className="mt-5 space-y-4">
                {questions[previewIdx]?.imageUrl ? (
                  <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={questions[previewIdx]?.imageUrl}
                      alt="Soru Görseli"
                      className="max-h-64 w-full object-contain p-2"
                    />
                  </div>
                ) : null}

                <p className="text-base font-black leading-relaxed text-night">
                  {questions[previewIdx]?.text || "Henüz soru metni yazılmadı..."}
                </p>
              </div>

              {/* Options */}
              <div className="mt-5 space-y-2.5">
                {questions[previewIdx]?.options.map((opt, oi) => {
                  const isSelected = previewSelectedOpt === oi;
                  const isCorrect = questions[previewIdx]?.correctIndex === oi;
                  const isTF = questions[previewIdx]?.type === "true_false";

                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => {
                        setPreviewSelectedOpt(oi);
                        triggerHaptic("click");
                      }}
                      className={`tap-scale flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? isCorrect
                            ? "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-200"
                            : "border-rose-400 bg-rose-50 text-rose-950 ring-2 ring-rose-200"
                          : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                            isSelected
                              ? isCorrect
                                ? "bg-emerald-600 text-white"
                                : "bg-rose-500 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isTF ? (oi === 0 ? "D" : "Y") : String.fromCharCode(65 + oi)}
                        </span>
                        <span className="text-sm font-bold">
                          {opt || `${String.fromCharCode(65 + oi)} Seçeneği`}
                        </span>
                      </div>

                      {isSelected && isCorrect && (
                        <span className="text-xs font-black text-emerald-600">Doğru Cevap ✅</span>
                      )}
                      {isSelected && !isCorrect && (
                        <span className="text-xs font-black text-rose-600">Yanlış ❌</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Teacher Explanation Reveal in Preview */}
              {previewSelectedOpt !== null && questions[previewIdx]?.explanation ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                  <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
                    <Sparkles className="size-4 text-amber-600" />
                    <span>Öğretmenin Çözüm Notu & İpucu</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-amber-950">
                    {questions[previewIdx]?.explanation}
                  </p>
                </div>
              ) : null}

              {/* Prev / Next controls */}
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  type="button"
                  disabled={previewIdx === 0}
                  onClick={() => {
                    setPreviewIdx((i) => Math.max(0, i - 1));
                    setPreviewSelectedOpt(null);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  ← Önceki Soru
                </button>

                <button
                  type="button"
                  disabled={previewIdx >= questions.length - 1}
                  onClick={() => {
                    setPreviewIdx((i) => Math.min(questions.length - 1, i + 1));
                    setPreviewSelectedOpt(null);
                  }}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-black text-white hover:bg-indigo-700 disabled:opacity-40"
                >
                  Sonraki Soru →
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* SORU EDİTÖRÜ (QUESTION EDITOR) MODU                            */
          /* ============================================================== */
          <>
            {/* 1. Sınav Genel Bilgileri */}
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    📝
                  </span>
                  <h2 className="text-sm font-black text-night">Sınav Bilgileri</h2>
                </div>
                <button
                  type="button"
                  onClick={clearDraft}
                  className="flex items-center gap-1 text-[0.7rem] font-bold text-slate-400 hover:text-rose-500 transition"
                  title="Tüm taslağı temizle"
                >
                  <RotateCcw className="size-3" />
                  <span>Taslağı Temizle</span>
                </button>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Sınav / Quiz Başlığı *
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: 8. Sınıf Üslü Sayılar LGS Denemesi"
                  maxLength={100}
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3.5 text-sm font-bold text-night outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Hedef Sınıf / Seviye
                  </label>
                  <select
                    value={targetGrade}
                    onChange={(e) => setTargetGrade(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-bold text-night outline-none focus:border-indigo-500"
                  >
                    <option value="Tüm Sınıflar">Tüm Sınıflar (Genel)</option>
                    <option value="İlkokul (1-4)">İlkokul (1-4. Sınıf)</option>
                    <option value="5. Sınıf">5. Sınıf</option>
                    <option value="6. Sınıf">6. Sınıf</option>
                    <option value="7. Sınıf">7. Sınıf</option>
                    <option value="8. Sınıf LGS">8. Sınıf LGS Hazırlık</option>
                    <option value="9. Sınıf">9. Sınıf</option>
                    <option value="10. Sınıf">10. Sınıf</option>
                    <option value="11. Sınıf">11. Sınıf</option>
                    <option value="12. Sınıf YKS">12. Sınıf / Mezun YKS</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Genel Sınav Zorluğu
                  </label>
                  <div className="mt-1 flex gap-1.5">
                    {[
                      { id: "easy", label: "Kolay", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                      { id: "medium", label: "Orta", cls: "bg-blue-50 text-blue-700 border-blue-200" },
                      { id: "hard", label: "Yeni Nesil", cls: "bg-purple-50 text-purple-700 border-purple-200" },
                    ].map((lvl) => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => {
                          setQuizDifficulty(lvl.id as "easy" | "medium" | "hard");
                          triggerHaptic("click");
                        }}
                        className={`flex-1 rounded-xl border py-2 text-xs font-black transition ${
                          quizDifficulty === lvl.id
                            ? `${lvl.cls} ring-2 ring-indigo-400 font-extrabold shadow-xs`
                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Açıklama veya Kazanım Hedefi (İsteğe bağlı)
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Örn: Kareköklü sayılarda tahmin ve işlem becerilerini ölçer."
                  maxLength={250}
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs font-medium text-slate-700 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* 2. Hızlı Format Şablonları */}
            <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/70 to-purple-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[0.65rem] font-black uppercase tracking-wider text-violet-700">
                    ⚡ Hızlı Format Şablonları
                  </span>
                  <p className="text-xs font-black text-night">
                    Tüm soruları tek tıkla hedef sınav formatına dönüştürün
                  </p>
                </div>
                <span className="text-[0.65rem] font-bold text-violet-600 bg-white/80 rounded-full px-2.5 py-0.5 border border-violet-200">
                  {questions.length} / 10 Soru
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TEMPLATE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPresetFormatToAll(preset.id)}
                    className="tap-scale flex flex-col justify-between rounded-2xl border border-violet-200 bg-white p-3 text-left shadow-2xs hover:border-violet-400 hover:shadow-xs transition"
                  >
                    <div>
                      <span className="text-xs font-black text-night">{preset.title}</span>
                      <p className="text-[0.62rem] font-bold text-violet-600 mt-0.5">{preset.badge}</p>
                    </div>
                    <span className="mt-2 text-[0.62rem] font-semibold text-slate-400">
                      Uygula ↗
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Math Formula Helper for Active Question */}
            <MathFormulaHelper
              onInsert={(symbol) => {
                if (questions[activeQuestionIdx]) {
                  updateQuestion(activeQuestionIdx, {
                    text: questions[activeQuestionIdx].text + symbol,
                  });
                }
              }}
              previewText={questions[activeQuestionIdx]?.text}
            />

            {/* 3. Soru Kartları Listesi */}
            <div className="space-y-4">
              {questions.map((q, qi) => {
                const optCount = q.options.length;
                const isTF = q.type === "true_false";

                return (
                  <div
                    key={qi}
                    className={`rounded-3xl border bg-white p-5 shadow-sm transition ${
                      activeQuestionIdx === qi ? "border-indigo-400 ring-2 ring-indigo-50" : "border-slate-100"
                    }`}
                  >
                    {/* Soru Başlık & Kontroller */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-xl bg-indigo-600 text-xs font-black text-white">
                          {qi + 1}
                        </span>
                        <div>
                          <span className="text-xs font-black text-night">
                            {qi + 1}. Soru
                          </span>
                          <span className="ml-2 text-[0.65rem] font-bold text-slate-400">
                            ({optCount} Seçenek)
                          </span>
                        </div>
                      </div>

                      {/* Soru Format & Aksiyon Menüsü */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Format Switcher */}
                        <div className="flex rounded-xl bg-slate-100 p-0.5">
                          <button
                            type="button"
                            onClick={() => setQuestionFormat(qi, "lgs_4")}
                            className={`rounded-lg px-2 py-1 text-[0.65rem] font-black transition ${
                              !isTF && optCount === 4
                                ? "bg-white text-indigo-600 shadow-2xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                            title="4 Seçenekli LGS / Standart"
                          >
                            4 Şıklı
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuestionFormat(qi, "yks_5")}
                            className={`rounded-lg px-2 py-1 text-[0.65rem] font-black transition ${
                              !isTF && optCount === 5
                                ? "bg-white text-purple-600 shadow-2xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                            title="5 Seçenekli YKS / TYT"
                          >
                            5 Şıklı (YKS)
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuestionFormat(qi, "true_false")}
                            className={`rounded-lg px-2 py-1 text-[0.65rem] font-black transition ${
                              isTF
                                ? "bg-white text-emerald-600 shadow-2xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                            title="Doğru / Yanlış"
                          >
                            D / Y
                          </button>
                        </div>

                        {/* Zorluk Düğmeleri */}
                        <div className="flex rounded-xl bg-slate-100 p-0.5">
                          {[
                            { id: "easy", dot: "🟢", label: "K" },
                            { id: "medium", dot: "🔵", label: "O" },
                            { id: "hard", dot: "🟣", label: "Z" },
                          ].map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => updateQuestion(qi, { difficulty: d.id as Difficulty })}
                              className={`rounded-lg px-1.5 py-1 text-[0.65rem] font-bold ${
                                (q.difficulty ?? "medium") === d.id
                                  ? "bg-white text-night shadow-2xs font-black"
                                  : "text-slate-400 hover:text-slate-700"
                              }`}
                              title={`${d.label} seviye`}
                            >
                              {d.dot}
                            </button>
                          ))}
                        </div>

                        {/* Yukarı / Aşağı Taşı */}
                        <button
                          type="button"
                          disabled={qi === 0}
                          onClick={() => moveQuestion(qi, "up")}
                          className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                          title="Yukarı taşı"
                        >
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={qi === questions.length - 1}
                          onClick={() => moveQuestion(qi, "down")}
                          className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                          title="Aşağı taşı"
                        >
                          <ArrowDown className="size-3.5" />
                        </button>

                        {/* Çoğalt */}
                        {questions.length < 10 ? (
                          <button
                            type="button"
                            onClick={() => duplicateQuestion(qi)}
                            className="flex size-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                            title="Soruyu çoğalt"
                          >
                            <Copy className="size-3.5" />
                          </button>
                        ) : null}

                        {/* Sil */}
                        {questions.length > 3 ? (
                          <button
                            type="button"
                            onClick={() => deleteQuestion(qi)}
                            className="flex size-7 items-center justify-center rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50"
                            title="Soruyu sil"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Soru Metni */}
                    <div className="mt-3">
                      <textarea
                        value={q.text}
                        onFocus={() => setActiveQuestionIdx(qi)}
                        onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                        placeholder="Soru metnini buraya yazın. (Örn: Aşağıdakilerden hangisi fotosentez için gerekli değildir?)"
                        rows={3}
                        maxLength={500}
                        className="w-full resize-none rounded-2xl border border-slate-200 p-3.5 text-sm font-semibold text-night outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    {/* Görsel / Şekil Ekleme (Açılır panel) */}
                    <div className="mt-2">
                      {q.imageUrl ? (
                        <div className="relative mt-2 inline-block rounded-xl border border-slate-200 p-1 bg-slate-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={q.imageUrl}
                            alt="Görsel"
                            className="h-28 max-w-full rounded-lg object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => updateQuestion(qi, { imageUrl: undefined })}
                            className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-rose-500 text-white shadow hover:bg-rose-600"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ) : showImageInputFor === qi ? (
                        <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                          <ImageIcon className="size-4 text-slate-400 shrink-0" />
                          <input
                            type="url"
                            placeholder="Görsel linki (örn: https://.../geometri.png)"
                            onBlur={(e) => {
                              if (e.target.value.trim()) {
                                updateQuestion(qi, { imageUrl: e.target.value.trim() });
                              }
                              setShowImageInputFor(null);
                            }}
                            className="w-full bg-transparent text-xs font-semibold outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowImageInputFor(null)}
                            className="text-xs font-bold text-slate-400 hover:text-slate-600"
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowImageInputFor(qi)}
                          className="flex items-center gap-1.5 text-[0.7rem] font-bold text-indigo-600 hover:text-indigo-700"
                        >
                          <ImageIcon className="size-3" />
                          <span>+ Soruya Şekil / Görsel Ekle</span>
                        </button>
                      )}
                    </div>

                    {/* Seçenekler (Grid) */}
                    <div className="mt-4">
                      <p className="mb-2 text-[0.68rem] font-black uppercase tracking-wider text-slate-400">
                        Seçenekler (Doğru cevabın radyo butonunu işaretleyin)
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, oi) => {
                          const isCorrect = q.correctIndex === oi;
                          return (
                            <div
                              key={oi}
                              className={`flex items-center gap-2 rounded-2xl border p-2.5 transition ${
                                isCorrect
                                  ? "border-emerald-400 bg-emerald-50/80 ring-2 ring-emerald-200"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                            >
                              <label className="flex items-center gap-2 shrink-0 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`correct-${qi}`}
                                  checked={isCorrect}
                                  onChange={() => {
                                    triggerHaptic("click");
                                    updateQuestion(qi, { correctIndex: oi });
                                  }}
                                  className="size-4 accent-emerald-600"
                                />
                                <span
                                  className={`flex size-6 items-center justify-center rounded-full text-xs font-black ${
                                    isCorrect ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {isTF ? (oi === 0 ? "D" : "Y") : String.fromCharCode(65 + oi)}
                                </span>
                              </label>

                              <input
                                value={opt}
                                onChange={(e) =>
                                  updateQuestion(qi, {
                                    options: q.options.map((o, idx) => (idx === oi ? e.target.value : o)),
                                  })
                                }
                                placeholder={`${String.fromCharCode(65 + oi)} seçeneği`}
                                maxLength={140}
                                className="w-full bg-transparent text-xs font-bold text-night outline-none"
                              />

                              {/* Şık Silme Butonu (2 şıktan fazlaysa ve TF değilse) */}
                              {!isTF && q.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeOptionFromQuestion(qi, oi)}
                                  className="text-slate-300 hover:text-rose-500 p-1"
                                  title="Bu şıkkı kaldır"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Şık Ekle Düğmesi (Maksimum 5 şık) */}
                      {!isTF && q.options.length < 5 ? (
                        <button
                          type="button"
                          onClick={() => addOptionToQuestion(qi)}
                          className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                        >
                          <Plus className="size-3.5" />
                          <span>+ Seçenek Ekle ({String.fromCharCode(65 + q.options.length)} Şıkkı)</span>
                        </button>
                      ) : null}
                    </div>

                    {/* Öğretmenin Çözüm Notu / Açıklaması */}
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <label className="flex items-center gap-1.5 text-[0.7rem] font-black uppercase tracking-wider text-amber-700">
                        <Sparkles className="size-3 text-amber-500" />
                        <span>Öğretmenin Çözüm Açıklaması & İpucu (İsteğe bağlı)</span>
                      </label>
                      <input
                        value={q.explanation ?? ""}
                        onChange={(e) => updateQuestion(qi, { explanation: e.target.value })}
                        placeholder="Öğrenci sınavı bitirince göreceği çözüm adımı, formül veya tüyo."
                        maxLength={500}
                        className="mt-1 w-full rounded-xl border border-amber-200 bg-amber-50/40 p-2.5 text-xs font-medium text-slate-700 outline-none focus:border-amber-400 focus:bg-white"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Soru Ekle Butonları */}
            {questions.length < 10 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuestions((prev) => [...prev, createEmptyQuestion("lgs_4")])}
                  className="tap-scale flex items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 py-3 text-xs font-black text-indigo-700 hover:bg-indigo-100 transition"
                >
                  <Plus className="size-4" />
                  <span>+ 4 Şıklı Soru</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuestions((prev) => [...prev, createEmptyQuestion("yks_5")])}
                  className="tap-scale flex items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/50 py-3 text-xs font-black text-purple-700 hover:bg-purple-100 transition"
                >
                  <Plus className="size-4" />
                  <span>+ 5 Şıklı (YKS)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuestions((prev) => [...prev, createEmptyQuestion("true_false")])}
                  className="tap-scale flex items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 py-3 text-xs font-black text-emerald-700 hover:bg-emerald-100 transition"
                >
                  <Plus className="size-4" />
                  <span>+ Doğru/Yanlış</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuestions((prev) => [...prev, createEmptyQuestion("primary_3")])}
                  className="tap-scale flex items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/50 py-3 text-xs font-black text-amber-700 hover:bg-amber-100 transition"
                >
                  <Plus className="size-4" />
                  <span>+ 3 Şıklı (İlkokul)</span>
                </button>
              </div>
            ) : null}

            {/* Error Banner */}
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
                ⚠️ {error}
              </div>
            ) : null}
          </>
        )}
      </main>

      {/* Fixed Sticky Footer for Publishing */}
      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur-md shadow-lg z-30">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="hidden sm:block">
            <p className="text-xs font-black text-night">
              {questions.length} Soru Hazır · {quizDifficulty === "hard" ? "Yeni Nesil" : "Standart"} Seviye
            </p>
            <p className="text-[0.65rem] font-bold text-slate-400">
              Otomatik kaydedildi (Taslak korumada)
            </p>
          </div>

          <div className="flex w-full sm:w-auto items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab((prev) => (prev === "edit" ? "preview" : "edit"));
                triggerHaptic("click");
              }}
              className="tap-scale flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-xs font-black text-slate-700 hover:bg-slate-100 transition"
            >
              <Eye className="size-4" />
              <span>{activeTab === "edit" ? "Önizle" : "Editör"}</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={submit}
              className="tap-scale flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-3.5 text-sm font-black text-white shadow-md hover:brightness-105 transition disabled:opacity-50"
            >
              <Sparkles className="size-4" />
              <span>{submitting ? "Yayınlanıyor..." : `Testi Yayınla (${questions.length} Soru)`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
