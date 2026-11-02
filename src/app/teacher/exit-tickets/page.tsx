"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  HelpCircle,
  Lightbulb,
  MessageCircle,
  Play,
  Plus,
  QrCode,
  RotateCcw,
  Send,
  Share2,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";

interface ExitTicketQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  kazanim: string;
}

interface StudentSubmission {
  id: string;
  studentName: string;
  avatar: string;
  answers: number[];
  score: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

interface ExitTicketSession {
  id: string;
  title: string;
  subject: string;
  grade: string;
  topic: string;
  pin: string;
  createdAt: string;
  questions: ExitTicketQuestion[];
  submissions: StudentSubmission[];
}

const STORAGE_KEY = "zigo_teacher_exit_tickets_v1";

const DEFAULT_SAMPLE_TICKETS: ExitTicketSession[] = [
  {
    id: "et-1",
    title: "Üslü İfadeler 5 Dakikalık Çıkış Bileti",
    subject: "Matematik",
    grade: "8. Sınıf",
    topic: "Üslü Sayılarda Çarpma ve Bölme",
    pin: "739 120",
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: "q1",
        kazanim: "M.8.1.2.2. Üslü ifadelerle ilgili temel kuralları anlar.",
        question: "2⁴ · 2³ işleminin sonucu kaçtır?",
        options: ["2⁷", "2¹²", "4⁷", "4¹²"],
        correctIndex: 0,
      },
      {
        id: "q2",
        kazanim: "M.8.1.2.3. Sayıların negatif kuvvetlerini hesaplar.",
        question: "5⁻² ifadesinin değeri aşağıdakilerden hangisidir?",
        options: ["-10", "-25", "1/25", "1/10"],
        correctIndex: 2,
      },
    ],
    submissions: [
      { id: "sub1", studentName: "Elif Naz", avatar: "👩‍🎓", answers: [0, 2], score: 100, isCorrect: true, timeSpentSeconds: 42 },
      { id: "sub2", studentName: "Kerem Kaya", avatar: "👨‍🎓", answers: [0, 2], score: 100, isCorrect: true, timeSpentSeconds: 58 },
      { id: "sub3", studentName: "Zeynep Demir", avatar: "⭐", answers: [0, 1], score: 50, isCorrect: false, timeSpentSeconds: 70 },
      { id: "sub4", studentName: "Can Polat", avatar: "🚀", answers: [1, 2], score: 50, isCorrect: false, timeSpentSeconds: 85 },
      { id: "sub5", studentName: "Merve Çelik", avatar: "🦊", answers: [0, 2], score: 100, isCorrect: true, timeSpentSeconds: 49 },
      { id: "sub6", studentName: "Burak Yılmaz", avatar: "🦁", answers: [1, 0], score: 0, isCorrect: false, timeSpentSeconds: 90 },
      { id: "sub7", studentName: "Ayşe Gül", avatar: "⚡", answers: [0, 2], score: 100, isCorrect: true, timeSpentSeconds: 61 },
      { id: "sub8", studentName: "Emir Şahin", avatar: "🎯", answers: [0, 2], score: 100, isCorrect: true, timeSpentSeconds: 53 },
    ],
  },
];

export default function ExitTicketsPage() {
  const router = useRouter();

  // State
  const [sessions, setSessions] = useState<ExitTicketSession[]>(DEFAULT_SAMPLE_TICKETS);
  const [activeSession, setActiveSession] = useState<ExitTicketSession>(DEFAULT_SAMPLE_TICKETS[0]);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [countdown, setCountdown] = useState(180); // 3 minutes
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New ticket form state
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("Matematik");
  const [newGrade, setNewGrade] = useState("8. Sınıf");
  const [newTopic, setNewTopic] = useState("");
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newOptions, setNewOptions] = useState(["", "", "", ""]);
  const [newCorrectIndex, setNewCorrectIndex] = useState(0);

  // Restore from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setActiveSession(parsed[0]);
        }
      }
    } catch {}
  }, []);

  function triggerHaptic(type: "click" | "success" | "warn" = "click") {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      if (type === "click") navigator.vibrate(8);
      else if (type === "success") navigator.vibrate([15, 30, 20]);
      else if (type === "warn") navigator.vibrate([30, 30, 30]);
    }
  }

  // Timer countdown when live
  useEffect(() => {
    if (!isLiveActive || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isLiveActive, countdown]);

  function startLiveTicket() {
    triggerHaptic("success");
    setIsLiveActive(true);
    setCountdown(180);
  }

  function stopLiveTicket() {
    triggerHaptic("warn");
    setIsLiveActive(false);
  }

  function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newTopic.trim()) return;

    triggerHaptic("success");

    const p1 = Math.floor(100 + Math.random() * 900);
    const p2 = Math.floor(100 + Math.random() * 900);

    const newTicket: ExitTicketSession = {
      id: "et-" + Date.now(),
      title: newTitle.trim(),
      subject: newSubject,
      grade: newGrade,
      topic: newTopic.trim(),
      pin: `${p1} ${p2}`,
      createdAt: new Date().toISOString(),
      questions: [
        {
          id: "q-" + Date.now(),
          kazanim: `${newSubject.slice(0, 1)}.${newGrade.replace(/[^0-9]/g, "")}.1.1. ${newTopic}`,
          question: newQuestionText.trim() || `${newTopic} konusunda dersin temel kavrayışını ölçen kontrol sorusu`,
          options: newOptions.every((o) => o.trim())
            ? newOptions
            : ["A Seçeneği (Doğru)", "B Seçeneği", "C Seçeneği", "D Seçeneği"],
          correctIndex: newCorrectIndex,
        },
      ],
      submissions: [],
    };

    const updated = [newTicket, ...sessions];
    setSessions(updated);
    setActiveSession(newTicket);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    setShowCreateModal(false);
    // Reset inputs
    setNewTitle("");
    setNewTopic("");
    setNewQuestionText("");
    setNewOptions(["", "", "", ""]);
  }

  // Statistics calculation for Heatmap
  const submissions = activeSession.submissions || [];
  const totalSubmissions = submissions.length;
  const fullScoreCount = submissions.filter((s) => s.score === 100).length;
  const partialScoreCount = submissions.filter((s) => s.score > 0 && s.score < 100).length;
  const lowScoreCount = submissions.filter((s) => s.score === 0).length;

  const averageScore =
    totalSubmissions > 0
      ? Math.round(submissions.reduce((sum, s) => sum + s.score, 0) / totalSubmissions)
      : 0;

  // Heatmap Color Category
  const heatmapColor =
    averageScore >= 80
      ? "bg-emerald-500 text-emerald-950 border-emerald-400"
      : averageScore >= 50
      ? "bg-amber-500 text-amber-950 border-amber-400"
      : "bg-rose-500 text-rose-950 border-rose-400";

  const heatmapLabel =
    averageScore >= 80
      ? "Yeşil Bölge (Kazanım Başarıyla Kavrandı)"
      : averageScore >= 50
      ? "Sarı Bölge (Kısmi Kavrayış - Hatırlatma Önerilir)"
      : "Kırmızı Bölge (Telafi ve Tekrar Dersi Gerekli)";

  function handleShareWhatsAppReport() {
    triggerHaptic("click");
    const text = `📢 Sayın Velilerimiz,\n\nBugünkü ${activeSession.subject} dersimizde son 5 dakikada uyguladığımız "Çıkış Bileti (Exit Ticket)" analizi tamamlanmıştır:\n\n📌 Konu: ${activeSession.topic}\n📊 Sınıf Kazanım Anlaşılma Ortalaması: %${averageScore}\n\nÖğrencilerimizin eksik kazanıma göre telafi ödevleri Zigo üzerinden atanmıştır. Takip etmenizi rica ederiz.\n🔗 www.zigo.com.tr`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 px-4 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/teacher")}
              className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900">Ders İçi Çıkış Bileti & Isı Haritası</h1>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[0.62rem] font-black text-amber-700 border border-amber-200">
                  Son 5 Dk Ölçümü
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold">
                Ders bitiminde anlık sınıf kavrayış ısı haritasını çıkar ve eksik kazanımı tespit et
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowCreateModal(true);
              triggerHaptic("click");
            }}
            className="tap-scale flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-700 shadow-sm transition"
          >
            <Plus className="size-4" />
            <span>Yeni Çıkış Bileti</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4 sm:p-6 space-y-6">
        {/* Ticket Selector Pills */}
        <div className="flex items-center justify-between overflow-x-auto pb-1 gap-2">
          <div className="flex gap-2">
            {sessions.map((sess) => (
              <button
                key={sess.id}
                type="button"
                onClick={() => {
                  setActiveSession(sess);
                  setIsLiveActive(false);
                  triggerHaptic("click");
                }}
                className={`rounded-2xl border px-4 py-2 text-xs font-black transition whitespace-nowrap ${
                  activeSession.id === sess.id
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {sess.title}
              </button>
            ))}
          </div>
        </div>

        {/* Live Presentation & PIN Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 p-6 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-indigo-300 border border-white/10">
                <Flame className="size-3.5 text-amber-400" />
                <span>Akıllı Tahta Canlı Çıkış Bileti</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">{activeSession.title}</h2>
              <p className="text-xs text-white/70 max-w-lg">
                Öğrenciler telefonlarından veya tabletlerinden <strong className="text-amber-300">www.zigo.com.tr/quizzes</strong> adresine girip PIN kodunu tuşlar:
              </p>
            </div>

            {/* Giant Live PIN */}
            <div className="flex flex-col items-center rounded-2xl border border-white/20 bg-white/10 px-8 py-4 backdrop-blur">
              <span className="text-[0.65rem] font-black uppercase tracking-widest text-slate-300">Giriş PIN Kodu</span>
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-amber-300 mt-0.5">
                {activeSession.pin}
              </span>
              <span className="text-[0.65rem] font-semibold text-white/50 mt-1">Öğrenci Giriş Şifresi</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-6 flex flex-wrap items-center justify-between border-t border-white/10 pt-4 gap-3">
            <div className="flex items-center gap-3">
              {isLiveActive ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-300 border border-emerald-500/30 animate-pulse">
                  <Clock className="size-4" />
                  <span>Kalan Süre: {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-white/60">
                  <Clock className="size-4 text-slate-400" />
                  <span>Önerilen Süre: 3 Dakika</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isLiveActive ? (
                <button
                  type="button"
                  onClick={startLiveTicket}
                  className="tap-scale flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-xs font-black text-white shadow-md hover:brightness-110 transition"
                >
                  <Play className="size-4 fill-current" />
                  <span>Akıllı Tahtada Başlat (Canlı)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopLiveTicket}
                  className="tap-scale flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-black text-white hover:bg-rose-700 shadow-md transition"
                >
                  <span>Süreyi Bitir & Sonuçları Kapat</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SINIF KAZANIM ISI HARİTASI (HEATMAP DASHBOARD)                  */}
        {/* ============================================================== */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-black text-sm">
                  🌡️
                </span>
                <h3 className="text-base font-black text-slate-900">Sınıf Anlık Kazanım Isı Haritası</h3>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                {activeSession.topic} · {totalSubmissions} Öğrenci Katıldı
              </p>
            </div>

            {/* General Thermometer Score Badge */}
            <div className={`flex items-center gap-2 rounded-2xl border px-4 py-2 shadow-2xs ${heatmapColor}`}>
              <span className="text-2xl font-black font-mono">%{averageScore}</span>
              <div className="text-left">
                <span className="text-[0.62rem] font-black uppercase tracking-wider block">Kavrama Seviyesi</span>
                <span className="text-xs font-bold">{averageScore >= 80 ? "Yüksek" : averageScore >= 50 ? "Orta" : "Kritik"}</span>
              </div>
            </div>
          </div>

          {/* Heatmap Bar Distribution */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Sınıf Dağılım Grafiği</span>
              <span className="text-[0.72rem] font-semibold text-slate-400">{heatmapLabel}</span>
            </div>

            {/* Tri-color Stacked Bar */}
            <div className="flex h-5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
              {fullScoreCount > 0 && (
                <div
                  className="bg-emerald-500 transition-all duration-700 hover:brightness-105 flex items-center justify-center text-[0.62rem] font-black text-white"
                  style={{ width: `${(fullScoreCount / totalSubmissions) * 100}%` }}
                  title={`Tam Kavrayanlar: ${fullScoreCount} Öğrenci`}
                >
                  %{Math.round((fullScoreCount / totalSubmissions) * 100)}
                </div>
              )}
              {partialScoreCount > 0 && (
                <div
                  className="bg-amber-400 transition-all duration-700 hover:brightness-105 flex items-center justify-center text-[0.62rem] font-black text-amber-950"
                  style={{ width: `${(partialScoreCount / totalSubmissions) * 100}%` }}
                  title={`Kısmen Anlayanlar: ${partialScoreCount} Öğrenci`}
                >
                  %{Math.round((partialScoreCount / totalSubmissions) * 100)}
                </div>
              )}
              {lowScoreCount > 0 && (
                <div
                  className="bg-rose-500 transition-all duration-700 hover:brightness-105 flex items-center justify-center text-[0.62rem] font-black text-white"
                  style={{ width: `${(lowScoreCount / totalSubmissions) * 100}%` }}
                  title={`Telafi Gerekenler: ${lowScoreCount} Öğrenci`}
                >
                  %{Math.round((lowScoreCount / totalSubmissions) * 100)}
                </div>
              )}
            </div>

            {/* Legend Pills */}
            <div className="flex flex-wrap gap-4 pt-1 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-emerald-500" />
                <span>Tam Kavrayanlar ({fullScoreCount} Öğrenci)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-amber-400" />
                <span>Kısmen Anlayanlar ({partialScoreCount} Öğrenci)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-rose-500" />
                <span>Özel Destek Gerekenler ({lowScoreCount} Öğrenci)</span>
              </span>
            </div>
          </div>

          {/* Student Breakdown Cards */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Öğrenci Yanıt ve Süre Detayları
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className={`flex items-center justify-between rounded-2xl border p-3 transition ${
                    sub.score === 100
                      ? "border-emerald-200 bg-emerald-50/50"
                      : sub.score >= 50
                      ? "border-amber-200 bg-amber-50/50"
                      : "border-rose-200 bg-rose-50/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{sub.avatar}</span>
                    <div>
                      <p className="text-xs font-black text-slate-800 line-clamp-1">{sub.studentName}</p>
                      <span className="text-[0.65rem] font-medium text-slate-400">
                        ⏱️ {sub.timeSpentSeconds}s içinde çözdü
                      </span>
                    </div>
                  </div>

                  <span
                    className={`rounded-lg px-2 py-0.5 text-xs font-black ${
                      sub.score === 100
                        ? "bg-emerald-600 text-white"
                        : sub.score >= 50
                        ? "bg-amber-500 text-white"
                        : "bg-rose-600 text-white"
                    }`}
                  >
                    %{sub.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Teacher Smart Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <Lightbulb className="size-4 text-amber-500" />
              <span>
                {lowScoreCount > 0
                  ? `${lowScoreCount} öğrencinin bu kazanımda özel desteğe ihtiyacı var.`
                  : "Sınıfın tamamı kazanımı başarıyla kavradı!"}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => router.push("/teacher/homework")}
                className="tap-scale flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-700 shadow-sm transition"
              >
                <BookOpen className="size-3.5" />
                <span>Telafi Testi Ata</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsAppReport}
                className="tap-scale flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-black text-emerald-800 hover:bg-emerald-100 transition"
                title="Veli Grubuna Kazanım Bülteni Gönder"
              >
                <MessageCircle className="size-3.5 text-emerald-600" />
                <span>Veliye Bildir</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* CREATE EXIT TICKET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-indigo-50 bg-gradient-to-r from-indigo-900 to-purple-900 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-white/10">
                  <Flame className="size-5 text-amber-400" />
                </span>
                <div>
                  <h3 className="text-base font-black">Yeni 5 Dk Çıkış Bileti</h3>
                  <p className="text-xs text-indigo-200">Dersin sonunda tek soruluk anlık kavrayış kontrolü</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl p-1 text-white/70 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-600">Bilet Başlığı</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Örn: 8-A Üslü Sayılar 5 Dk Çıkış Bileti"
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600">Ders</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="Matematik">Matematik</option>
                    <option value="Fen Bilimleri">Fen Bilimleri</option>
                    <option value="Türkçe">Türkçe</option>
                    <option value="İngilizce">İngilizce</option>
                    <option value="T.C. İnkılap Tarihi">T.C. İnkılap Tarihi</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600">Sınıf</label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="5. Sınıf">5. Sınıf</option>
                    <option value="6. Sınıf">6. Sınıf</option>
                    <option value="7. Sınıf">7. Sınıf</option>
                    <option value="8. Sınıf">8. Sınıf</option>
                    <option value="9. Sınıf">9. Sınıf</option>
                    <option value="10. Sınıf">10. Sınıf</option>
                    <option value="11. Sınıf">11. Sınıf</option>
                    <option value="12. Sınıf">12. Sınıf</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-600">Konu / Kazanım</label>
                <input
                  type="text"
                  required
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Örn: Negatif Üs ve Çözümleme"
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-600">
                  Kontrol Sorusu Metni
                </label>
                <textarea
                  rows={2}
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="Örn: 3⁻² ifadesinin değeri kaçtır?"
                  className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-600">
                  Şıklar (Doğru olanı işaretleyin)
                </label>
                {newOptions.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctChoice"
                      checked={newCorrectIndex === oi}
                      onChange={() => setNewCorrectIndex(oi)}
                      className="size-4 accent-indigo-600"
                    />
                    <input
                      type="text"
                      placeholder={`${String.fromCharCode(65 + oi)} Seçeneği`}
                      value={opt}
                      onChange={(e) => {
                        const next = [...newOptions];
                        next[oi] = e.target.value;
                        setNewOptions(next);
                      }}
                      className="flex-1 rounded-xl border border-slate-200 p-2 text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="tap-scale flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-xs font-black text-white hover:bg-indigo-700 shadow-sm transition"
                >
                  <Plus className="size-4" />
                  <span>Çıkış Biletini Kaydet & Sınıfa Aç</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
