"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Maximize2,
  Minimize2,
  Plus,
  Printer,
  RotateCcw,
  Sparkles,
  Upload,
  XCircle,
} from "lucide-react";

import {
  InteractiveOpticalForm,
} from "@/components/quiz/interactive-optical-form";
import {
  PrintableQuestion,
  QuizPrintBookletModal,
} from "@/components/quiz/quiz-print-booklet-modal";
import { WhatsAppChallengeCard } from "@/components/share/whatsapp-challenge-card";

interface PdfExamItem {
  id: string;
  title: string;
  grade: string;
  badge: string;
  durationMinutes: number;
  optionsCount: number; // 4 or 5
  pdfUrl?: string;
  questions: {
    text: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
    imageUrl?: string;
  }[];
}

const BUILTIN_PDF_EXAMS: PdfExamItem[] = [
  {
    id: "lgs-math-deneme-1",
    title: "MEB LGS 8. Sınıf Matematik 1. Dönem Denemesi",
    grade: "8. Sınıf LGS",
    badge: "MEB Yeni Nesil",
    durationMinutes: 20,
    optionsCount: 4,
    questions: [
      {
        text: "Bir kenar uzunluğu 2⁴ cm olan kare şeklindeki kartonun alanı kaç cm² dir?",
        options: ["2⁶", "2⁷", "2⁸", "2¹⁶"],
        correctIndex: 2,
        explanation: "Karenin alanı = a² = (2⁴)² = 2^(4*2) = 2⁸ cm² bulunur.",
      },
      {
        text: "√192 sayısı aşağıdaki hangi ardışık iki tam sayı arasındadır?",
        options: ["11 ile 12", "12 ile 13", "13 ile 14", "14 ile 15"],
        correctIndex: 2,
        explanation: "13² = 169 ve 14² = 196 olduğundan; √169 < √192 < √196, yani 13 ile 14 arasındadır.",
      },
      {
        text: "A = 2³ · 3² · 5 ve B = 2² · 3³ · 7 olduğuna göre EBOB(A, B) kaçtır?",
        options: ["36", "72", "108", "180"],
        correctIndex: 0,
        explanation: "Ortak asal çarpanların küçük üsleri alınır: EBOB = 2² · 3² = 4 · 9 = 36.",
      },
      {
        text: "Bir torbada 4 mavi, 5 kırmızı ve 3 sarı bilye vardır. Rastgele çekilen bir bilyenin kırmızı olmama olasılığı kaçtır?",
        options: ["5/12", "7/12", "1/2", "3/4"],
        correctIndex: 1,
        explanation: "Toplam bilye = 4 + 5 + 3 = 12. Kırmızı olmayanlar = 4 mavi + 3 sarı = 7. Olasılık = 7/12.",
      },
      {
        text: "Bir okul gezisinde 48 kız ve 60 erkek öğrenci vardır. Her odada eşit sayıda ve sadece aynı cinsiyetten öğrenciler kalacaktır. En az kaç oda gerekir?",
        options: ["8", "9", "10", "12"],
        correctIndex: 1,
        explanation: "Oda kapasitesi EBOB(48, 60) = 12 olmalıdır. Oda sayısı = (48 / 12) + (60 / 12) = 4 + 5 = 9 oda.",
      },
    ],
  },
  {
    id: "yks-tyt-turkce-deneme",
    title: "YKS / TYT Türkçe Paragraf & Anlam Denemesi",
    grade: "12. Sınıf / YKS",
    badge: "ÖSYM 5 Seçenek",
    durationMinutes: 15,
    optionsCount: 5,
    questions: [
      {
        text: "Bu parçada altı çizili sözle anlatılmak istenen aşağıdakilerden hangisidir: 'Yazar, eserlerinde sözcükleri kuyumcu titizliğiyle işliyor.'",
        options: [
          "Süslü ve gösterişli ifadelere ağırlık vermek",
          "Kelimeleri özenle ve derinlemesine seçip kullanmak",
          "Pahalı ve nadir kavramları metne dahil etmek",
          "Geleneksel motifleri modern dille aktarmak",
          "Akıcı ve yalın bir anlatım biçimi yakalamak",
        ],
        correctIndex: 1,
        explanation: "'Kuyumcu titizliği' benzetmesi, sözcüklerin büyük bir özen, dikkat ve ustalıkla tek tek seçilmesini ifade eder.",
      },
      {
        text: "Aşağıdaki cümlelerin hangisinde bir yazım yanlışı vardır?",
        options: [
          "Herkes kendi sorumluluğunu bilmeli.",
          "Bu akşamki konsere sen de gelecek misin?",
          "O kadar çok çalıştıki sonunda başardı.",
          "TBMM'nin aldığı kararlar yayımlandı.",
          "Birkaç gün sonra sonuçlar açıklanacak.",
        ],
        correctIndex: 2,
        explanation: "'Çalıştı ki' cümlesinde 'ki' bağlaçtır ve ayrı yazılmalıdır ('çalıştı ki').",
      },
      {
        text: "Aşağıdaki cümlelerin hangisinde altı çizili sözcük mecaz anlamda kullanılmıştır?",
        options: [
          "Kapının kolu kırılınca içeride kaldık.",
          "Bize karşı gösterdiği bu soğuk tavır hepimizi şaşırttı.",
          "Sabahın erken saatlerinde göl kenarında yürüdü.",
          "Çantasındaki kalın defteri masaya bıraktı.",
          "Bahçedeki kuru yaprakları süpürdü.",
        ],
        correctIndex: 1,
        explanation: "'Soğuk tavır' ifadesindeki soğuk sözcüğü sıcaklık anlamından uzaklaşarak 'ilgisiz, mesafeli' anlamında mecazlaşmıştır.",
      },
      {
        text: "Bu parçanın ana düşüncesi aşağıdakilerden hangisidir?",
        options: [
          "Zamanı verimli kullanmanın tek yolu plan yapmaktır.",
          "Başarı, yetenekten çok disiplinli ve sürekli çalışmanın ürünüdür.",
          "Kitap okumak insanın hayal gücünü geliştiren yegane unsurdur.",
          "Sanatçılar toplumsal sorunlara ayna tutmalıdır.",
          "Eğitim küçük yaşlarda başladığında kalıcı izler bırakır.",
        ],
        correctIndex: 1,
        explanation: "Metin boyunca disiplinli çalışmanın yetenekten daha üstün sonuçlar doğurduğu vurgulanmıştır.",
      },
    ],
  },
  {
    id: "meb-fen-tarama-1",
    title: "MEB Fen Bilimleri Beceri Temelli Tarama Testi",
    grade: "LGS / Ortaokul",
    badge: "Kazanım Odaklı",
    durationMinutes: 15,
    optionsCount: 4,
    questions: [
      {
        text: "Dünya'nın Güneş etrafında dolanması ve eksen eğikliği sonucu aşağıdakilerden hangisi gerçekleşir?",
        options: [
          "Gece ve gündüzün ardalanması",
          "Mevsimlerin oluşması",
          "Güneş lekelerinin değişmesi",
          "Ay'ın evrelerinin tamamlanması",
        ],
        correctIndex: 1,
        explanation: "Dünya'nın 23° 27'lik eksen eğikliği ve Güneş etrafındaki dolanımı mevsimlerin meydana gelmesini sağlar.",
      },
      {
        text: "DNA'nın kendini eşlemesi sırasında sitoplazmadaki serbest nükleotit miktarı nasıl değişir?",
        options: ["Artar", "Azalır", "Önce artar sonra azalır", "Değişmez"],
        correctIndex: 1,
        explanation: "DNA eşlenirken serbest nükleotitler çekirdeğe girerek kullanıldığı için sitoplazmadaki miktarları azalır.",
      },
      {
        text: "Asit yağmurlarına sebep olan temel gazlar aşağıdakilerin hangisinde birlikte verilmiştir?",
        options: [
          "O₂ ve N₂",
          "SO₂ ve NO₂",
          "CO ve He",
          "CH₄ ve O₃",
        ],
        correctIndex: 1,
        explanation: "Kükürt dioksit (SO₂) ve azot dioksit (NO₂) su buharı ile tepkimeye girerek asit yağmurlarını oluşturur.",
      },
    ],
  },
];

export default function PdfQuizzesArenaPage() {
  const [selectedExamId, setSelectedExamId] = useState(BUILTIN_PDF_EXAMS[0].id);
  const [activeTab, setActiveTab] = useState<"booklet" | "optical">("booklet");
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(20 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [customPdfUrl, setCustomPdfUrl] = useState("");
  const [isCustomPdfModalOpen, setIsCustomPdfModalOpen] = useState(false);

  const currentExam =
    BUILTIN_PDF_EXAMS.find((e) => e.id === selectedExamId) ?? BUILTIN_PDF_EXAMS[0];

  // Reset exam on switch
  useEffect(() => {
    setAnswers(Array.from({ length: currentExam.questions.length }, () => null));
    setTimerSeconds(currentExam.durationMinutes * 60);
    setIsTimerRunning(true);
    setIsSubmitted(false);
    setActiveQuestionIdx(0);
  }, [selectedExamId, currentExam]);

  // Timer Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0 && !isSubmitted) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds, isSubmitted]);

  function handleSelectAnswer(qIdx: number, optIdx: number | null) {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIdx] = optIdx;
      return next;
    });
  }

  function handleOpticalSubmit() {
    const unAnsweredCount = answers.filter((a) => a === null).length;
    if (unAnsweredCount > 0) {
      const confirmSubmit = window.confirm(
        `Optik formda henüz işaretlemediğiniz ${unAnsweredCount} soru bulunuyor. Sınavı tamamlayıp teslim etmek istiyor musunuz?`,
      );
      if (!confirmSubmit) return;
    }
    setIsSubmitted(true);
    setIsTimerRunning(false);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([15, 30, 20]);
    }
  }

  function restartExam() {
    setAnswers(Array.from({ length: currentExam.questions.length }, () => null));
    setTimerSeconds(currentExam.durationMinutes * 60);
    setIsTimerRunning(true);
    setIsSubmitted(false);
    setActiveQuestionIdx(0);
  }

  const correctAnswersList = currentExam.questions.map((q) => q.correctIndex);
  const correctCount = answers.filter((a, i) => a === correctAnswersList[i]).length;
  const score = Math.round((correctCount / currentExam.questions.length) * 100);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/quizzes"
            className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-rose-500 text-white font-black text-[0.65rem]">
                PDF
              </span>
              <h1 className="text-sm font-black text-night truncate max-w-[180px] sm:max-w-md">
                {currentExam.title}
              </h1>
            </div>
            <p className="text-[0.68rem] font-bold text-slate-400">
              {currentExam.grade} · {currentExam.questions.length} Soru · {currentExam.badge}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Sınav Seçici Dropdown */}
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="hidden sm:inline-block rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
          >
            {BUILTIN_PDF_EXAMS.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title}
              </option>
            ))}
          </select>

          {/* Sınav Kitapçığı & PDF Yazdır Butonu */}
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="tap-scale flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
            title="Sınavı PDF Olarak Kaydet / Yazdır"
          >
            <Printer className="size-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Kitapçık & PDF Yazdır</span>
          </button>

          {/* Kendi PDF'ini Yükle */}
          <Link
            href="/quizzes/create"
            className="tap-scale flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1.5 text-xs font-black text-white shadow-xs hover:brightness-105"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Yeni Sınav Oluştur</span>
          </Link>
        </div>
      </header>

      {/* Mobile Tab Switcher: Soru Kitapçığı vs Optik Form */}
      <div className="md:hidden flex border-b border-slate-200 bg-white px-4 py-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("booklet")}
          className={`flex-1 rounded-xl py-2 text-xs font-black transition flex items-center justify-center gap-1.5 ${
            activeTab === "booklet"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          <BookOpen className="size-3.5" />
          <span>Soru Kitapçığı</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("optical")}
          className={`flex-1 rounded-xl py-2 text-xs font-black transition flex items-center justify-center gap-1.5 ${
            activeTab === "optical"
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          <CheckCircle2 className="size-3.5" />
          <span>Optik Form ({answers.filter((a) => a !== null).length}/{currentExam.questions.length})</span>
        </button>
      </div>

      {/* Main Split Screen Area */}
      <div className="flex-1 mx-auto w-full max-w-7xl p-3 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left Side: Professional 2-Column Question Booklet View (or Embedded PDF) */}
        <div
          className={`md:col-span-7 lg:col-span-8 space-y-4 ${
            activeTab === "booklet" ? "block" : "hidden md:block"
          }`}
        >
          {/* Booklet Header Banner */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[0.65rem] font-black uppercase tracking-wider text-indigo-600">
                  MEB & ÖSYM Kazanım Formatı
                </span>
                <h2 className="text-base font-black text-night">{currentExam.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {currentExam.optionsCount === 5 ? "5 Seçenek (YKS)" : "4 Seçenek (LGS)"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:text-slate-800"
                  title="PDF Sınav Kağıdını Yazdır"
                >
                  <Printer className="size-4" />
                </button>
              </div>
            </div>

            {/* Questions List (Two-Column Styled) */}
            <div className="mt-4 space-y-6">
              {currentExam.questions.map((q, idx) => {
                const isSelected = answers[idx] !== null;
                const chosenLetter =
                  answers[idx] !== null ? String.fromCharCode(65 + answers[idx]!) : null;

                return (
                  <div
                    key={idx}
                    id={`question-box-${idx}`}
                    onClick={() => setActiveQuestionIdx(idx)}
                    className={`rounded-2xl border p-4 transition ${
                      activeQuestionIdx === idx
                        ? "border-indigo-400 bg-indigo-50/20 ring-2 ring-indigo-100"
                        : "border-slate-100 bg-white hover:border-slate-200"
                    }`}
                  >
                    {/* Soru No & Metin */}
                    <div className="flex items-start gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">
                        {idx + 1}
                      </span>
                      <div className="flex-1 space-y-2">
                        {q.imageUrl && (
                          <div className="relative overflow-hidden rounded-xl border border-slate-200 p-1 bg-slate-50 max-h-48 inline-block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={q.imageUrl}
                              alt="Soru Görseli"
                              className="max-h-44 object-contain"
                            />
                          </div>
                        )}
                        <p className="text-sm font-black leading-relaxed text-night">
                          {q.text}
                        </p>
                      </div>
                    </div>

                    {/* Şıklar */}
                    <div className="mt-4 pl-10 space-y-2">
                      {q.options.map((opt, oi) => {
                        const letter = String.fromCharCode(65 + oi);
                        const isChosen = answers[idx] === oi;
                        const isCorrectOpt = isSubmitted && q.correctIndex === oi;
                        const isWrongChoice = isSubmitted && isChosen && q.correctIndex !== oi;

                        let optClass = "border-slate-200 bg-white hover:border-indigo-300";
                        if (isChosen && !isSubmitted) {
                          optClass = "border-indigo-600 bg-indigo-50/80 font-bold ring-1 ring-indigo-300";
                        } else if (isCorrectOpt) {
                          optClass = "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-300";
                        } else if (isWrongChoice) {
                          optClass = "border-rose-400 bg-rose-50 text-rose-950 line-through";
                        }

                        return (
                          <button
                            key={oi}
                            type="button"
                            onClick={() => handleSelectAnswer(idx, oi)}
                            className={`tap-scale flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs transition ${optClass}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                                  isChosen
                                    ? "bg-slate-900 text-white"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {letter}
                              </span>
                              <span className="font-semibold leading-relaxed">{opt}</span>
                            </div>

                            {/* Optik Kod Durumu */}
                            {isChosen && !isSubmitted && (
                              <span className="text-[0.65rem] font-black text-indigo-600">
                                Optik Kodlandı ✓
                              </span>
                            )}
                            {isCorrectOpt && (
                              <span className="text-[0.65rem] font-black text-emerald-600">
                                Doğru Cevap ✅
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Çözüm Açıklaması (Sınav bittiğinde gösterilir) */}
                    {isSubmitted && q.explanation ? (
                      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs">
                        <div className="flex items-center gap-1.5 text-amber-900 font-black">
                          <Sparkles className="size-3.5 text-amber-600" />
                          <span>Öğretmenin Çözüm Açıklaması</span>
                        </div>
                        <p className="mt-1 text-slate-700 italic">{q.explanation}</p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Digital Optical Bubble Sheet (Sticky on Desktop) */}
        <div
          className={`md:col-span-5 lg:col-span-4 space-y-4 md:sticky md:top-20 ${
            activeTab === "optical" ? "block" : "hidden md:block"
          }`}
        >
          {/* Optical Sheet Container */}
          <InteractiveOpticalForm
            totalQuestions={currentExam.questions.length}
            optionsCount={currentExam.optionsCount}
            answers={answers}
            onSelectAnswer={handleSelectAnswer}
            activeQuestionIndex={activeQuestionIdx}
            onJumpToQuestion={(idx) => {
              setActiveQuestionIdx(idx);
              const el = document.getElementById(`question-box-${idx}`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            isSubmitted={isSubmitted}
            correctAnswers={isSubmitted ? correctAnswersList : undefined}
            timerSeconds={timerSeconds}
            examTitle={currentExam.title}
          />

          {/* Submission and Action Panel */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            {!isSubmitted ? (
              <button
                type="button"
                onClick={handleOpticalSubmit}
                className="tap-scale flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-4 text-sm font-black text-white shadow-md hover:brightness-105 transition"
              >
                <CheckCircle2 className="size-4" />
                <span>Optik Formu Teslim Et & Bitir</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-4 text-center border border-indigo-100">
                  <p className="text-3xl">🎉</p>
                  <h3 className="mt-1 text-lg font-black text-night">Optik Form Okundu!</h3>
                  <p className="text-2xl font-black text-indigo-600 mt-1">{score} Puan</p>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">
                    {correctCount} / {currentExam.questions.length} Doğru
                  </p>
                </div>

                {/* Viral WhatsApp Challenge Card */}
                <WhatsAppChallengeCard
                  title={currentExam.title}
                  score={score}
                  type="quiz"
                  detailText={`${correctCount}/${currentExam.questions.length} Doğru · PDF Deneme`}
                  rewardPoints={50}
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={restartExam}
                    className="tap-scale flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-3 text-xs font-black text-slate-700 hover:bg-slate-50"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Tekrar Çöz</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrintModalOpen(true)}
                    className="tap-scale flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-3 text-xs font-black text-white hover:bg-slate-800"
                  >
                    <Printer className="size-3.5" />
                    <span>PDF Yazdır</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Printable Exam Booklet Modal */}
      <QuizPrintBookletModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title={currentExam.title}
        targetGrade={currentExam.grade}
        questions={currentExam.questions as PrintableQuestion[]}
      />
    </div>
  );
}
