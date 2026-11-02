"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  Crown,
  Maximize2,
  Play,
  QrCode,
  RotateCcw,
  Sparkles,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  XCircle,
} from "lucide-react";
import { CertificateModal } from "@/components/teacher/certificate-modal";

interface LiveStudent {
  id: string;
  name: string;
  score: number;
  lastAnswerCorrect?: boolean;
  avatar: string;
}

const SAMPLE_QUESTIONS = [
  {
    id: 1,
    text: "2⁵ ifadesinin değeri aşağıdakilerden hangisidir?",
    options: ["10", "16", "25", "32"],
    correctIndex: 3,
    timeLimit: 20,
  },
  {
    id: 2,
    text: "Türkiye Cumhuriyeti'nin başkenti neresidir?",
    options: ["İstanbul", "Ankara", "İzmir", "Bursa"],
    correctIndex: 1,
    timeLimit: 15,
  },
  {
    id: 3,
    text: "Bir üçgenin iç açıları toplamı kaç derecedir?",
    options: ["90°", "180°", "270°", "360°"],
    correctIndex: 1,
    timeLimit: 15,
  },
  {
    id: 4,
    text: "Hangisi fotosentez için gerekli temel bileşendir?",
    options: ["Karbondioksit ve Güneş Işığı", "Yalnızca Azot", "Kükürt", "Metan Gazı"],
    correctIndex: 0,
    timeLimit: 20,
  },
];

const INITIAL_MOCK_STUDENTS: LiveStudent[] = [
  { id: "s1", name: "Elif Naz", score: 0, avatar: "👩‍🎓" },
  { id: "s2", name: "Kerem Kaya", score: 0, avatar: "👨‍🎓" },
  { id: "s3", name: "Zeynep Demir", score: 0, avatar: "⭐" },
  { id: "s4", name: "Can Polat", score: 0, avatar: "🚀" },
  { id: "s5", name: "Merve Çelik", score: 0, avatar: "🦊" },
];

export default function TeacherLiveArenaPage() {
  const router = useRouter();

  // State: 'lobby' | 'in_question' | 'question_review' | 'podium'
  const [phase, setPhase] = useState<"lobby" | "in_question" | "question_review" | "podium">("lobby");
  const [roomPin, setRoomPin] = useState("482 195");
  const [students, setStudents] = useState<LiveStudent[]>(INITIAL_MOCK_STUDENTS);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<{ name: string; score: number } | null>(null);

  // Generate random pin on mount
  useEffect(() => {
    const p1 = Math.floor(100 + Math.random() * 900);
    const p2 = Math.floor(100 + Math.random() * 900);
    setRoomPin(`${p1} ${p2}`);
  }, []);

  function triggerHaptic(type: "click" | "success" | "warn" = "click") {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      if (type === "click") navigator.vibrate(8);
      else if (type === "success") navigator.vibrate([20, 50, 20]);
      else if (type === "warn") navigator.vibrate([40, 30, 40]);
    }
  }

  // Question Timer
  useEffect(() => {
    if (phase !== "in_question") return;

    if (timeLeft <= 0) {
      // Reveal answers
      triggerHaptic("warn");
      setPhase("question_review");
      // Simulate answer scores for students
      setStudents((prev) =>
        prev
          .map((s) => {
            const correct = Math.random() > 0.3;
            const points = correct ? Math.round(600 + Math.random() * 400) : 0;
            return {
              ...s,
              score: s.score + points,
              lastAnswerCorrect: correct,
            };
          })
          .sort((a, b) => b.score - a.score)
      );
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
      // Simulate incoming student answers
      setAnsweredCount((c) => Math.min(students.length, c + (Math.random() > 0.6 ? 1 : 0)));
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, timeLeft, students.length]);

  function startQuiz() {
    triggerHaptic("success");
    setCurrentQIndex(0);
    setTimeLeft(SAMPLE_QUESTIONS[0].timeLimit);
    setAnsweredCount(0);
    setPhase("in_question");
  }

  function nextQuestion() {
    triggerHaptic("click");
    if (currentQIndex < SAMPLE_QUESTIONS.length - 1) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      setTimeLeft(SAMPLE_QUESTIONS[nextIdx].timeLimit);
      setAnsweredCount(0);
      setPhase("in_question");
    } else {
      setPhase("podium");
      triggerHaptic("success");
    }
  }

  function restartLive() {
    triggerHaptic("click");
    setStudents(INITIAL_MOCK_STUDENTS.map((s) => ({ ...s, score: 0 })));
    setCurrentQIndex(0);
    setPhase("lobby");
  }

  const currentQ = SAMPLE_QUESTIONS[currentQIndex];
  const sortedStudents = [...students].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="flex items-center justify-between border-b border-white/10 bg-slate-900/60 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/teacher")}
            className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-white/80 hover:bg-white/20 transition"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black">Zigo Canlı Quiz Arenası</h1>
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[0.62rem] font-bold text-indigo-300 border border-indigo-500/30">
                Akıllı Tahta Modu
              </span>
            </div>
            <p className="text-xs text-white/50">Kahoot formatında anlık çoktan seçmeli yarışma</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-white/80 hover:bg-white/20"
            title={soundEnabled ? "Sesi Kapat" : "Sesi Aç"}
          >
            {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>

          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-mono font-bold text-amber-300">
            PIN: {roomPin}
          </div>
        </div>
      </header>

      {/* Main Presentation Stage */}
      <main className="flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full p-6">
        {/* PHASE 1: LOBBY */}
        {phase === "lobby" && (
          <div className="flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-300">
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">
                Akıllı Tahtaya Yansıtın
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                Oyuna Katılmak İçin
              </h2>
              <p className="text-sm sm:text-base font-semibold text-white/70">
                Öğrenciler telefonlarından veya tabletlerinden <strong className="text-indigo-300">www.zigo.com.tr/quizzes</strong> adresine girip PIN kodunu yazar:
              </p>
            </div>

            {/* Giant PIN Box */}
            <div className="relative group">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-75 blur-xl group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
              <div className="relative flex flex-col items-center rounded-3xl border border-white/20 bg-slate-900/90 px-10 py-6 backdrop-blur">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Giriş PIN Kodu</span>
                <span className="mt-1 text-5xl sm:text-7xl font-black font-mono tracking-wider text-amber-300">
                  {roomPin}
                </span>
                <span className="mt-2 text-xs font-semibold text-white/50">
                  📱 QR Kod veya PIN ile anında katılım
                </span>
              </div>
            </div>

            {/* Joined Students Avatars */}
            <div className="w-full max-w-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-white/60">
                <span className="flex items-center gap-1.5">
                  <Users className="size-4 text-indigo-400" />
                  <span>Sınıftaki Öğrenciler ({students.length})</span>
                </span>
                <span className="text-emerald-400">● Canlı Bekleme Odası</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur min-h-[120px]">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-black text-white shadow-sm animate-in zoom-in-95 duration-200"
                  >
                    <span>{student.avatar}</span>
                    <span>{student.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              type="button"
              onClick={startQuiz}
              className="tap-scale flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 px-10 py-4 text-base font-black text-white shadow-xl hover:brightness-110 transition"
            >
              <Play className="size-5 fill-current" />
              <span>Yarışmayı Başlat!</span>
            </button>
          </div>
        )}

        {/* PHASE 2: IN QUESTION */}
        {phase === "in_question" && currentQ && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Bar with Question Count & Timer */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-indigo-300">
                Soru {currentQIndex + 1} / {SAMPLE_QUESTIONS.length}
              </span>

              {/* Countdown Dial */}
              <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2">
                <Clock className="size-5 text-amber-400 animate-spin" style={{ animationDuration: "3s" }} />
                <span className="text-2xl font-black font-mono text-amber-300">{timeLeft}s</span>
              </div>

              <span className="text-sm font-black text-white/70">
                Cevaplar: <strong className="text-emerald-400">{answeredCount}</strong> / {students.length}
              </span>
            </div>

            {/* Question Text Box */}
            <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-slate-900 to-slate-900/80 p-8 text-center shadow-2xl">
              <h2 className="text-2xl sm:text-4xl font-black text-white leading-relaxed">
                {currentQ.text}
              </h2>
            </div>

            {/* 4 Colored Answer Cards (Kahoot Style: Red, Blue, Yellow, Green) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentQ.options.map((opt, oi) => {
                const styles = [
                  "from-rose-600 to-red-700 border-red-500/50",
                  "from-blue-600 to-indigo-700 border-blue-500/50",
                  "from-amber-500 to-orange-600 border-amber-500/50",
                  "from-emerald-600 to-teal-700 border-emerald-500/50",
                ][oi % 4];

                const symbols = ["▲", "◆", "●", "■"][oi % 4];

                return (
                  <div
                    key={oi}
                    className={`flex items-center gap-4 rounded-3xl border bg-gradient-to-br ${styles} p-6 shadow-lg text-white`}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-lg font-black backdrop-blur">
                      {symbols}
                    </span>
                    <span className="text-lg sm:text-xl font-black leading-snug">{opt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PHASE 3: QUESTION REVIEW (Leaderboard & Correct Answer Reveal) */}
        {phase === "question_review" && currentQ && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="size-5" />
                Doğru Cevap Açıklandı
              </span>

              <button
                type="button"
                onClick={nextQuestion}
                className="tap-scale flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-black text-white hover:bg-indigo-500 transition"
              >
                <span>{currentQIndex < SAMPLE_QUESTIONS.length - 1 ? "Sonraki Soru →" : "Sonuçları Göster 🏆"}</span>
              </button>
            </div>

            {/* Correct Answer Banner */}
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/40 p-5 text-center">
              <p className="text-xs font-black uppercase tracking-wider text-emerald-400">Doğru Seçenek</p>
              <p className="text-xl sm:text-2xl font-black text-white mt-1">
                {String.fromCharCode(65 + currentQ.correctIndex)}) {currentQ.options[currentQ.correctIndex]}
              </p>
            </div>

            {/* Live Leaderboard */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Anlık Sınıf Sıralaması
              </h3>
              <div className="space-y-2">
                {sortedStudents.map((st, rank) => (
                  <div
                    key={st.id}
                    className={`flex items-center justify-between rounded-2xl border p-3.5 transition ${
                      rank === 0
                        ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
                        : "border-white/10 bg-white/5 text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 items-center justify-center rounded-xl bg-white/10 text-xs font-black font-mono">
                        #{rank + 1}
                      </span>
                      <span className="text-base">{st.avatar}</span>
                      <span className="text-sm font-black">{st.name}</span>
                      {st.lastAnswerCorrect && (
                        <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[0.62rem] font-bold text-emerald-400">
                          +Hızlı Doğru
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-black font-mono">{st.score} Puan</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PHASE 4: FINAL PODIUM */}
        {phase === "podium" && (
          <div className="flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-400">
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-400 flex items-center justify-center gap-1.5">
                <Sparkles className="size-4" />
                <span>Quiz Arenası Şampiyonları</span>
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white">Tebrikler Sınıf!</h2>
              <p className="text-sm font-semibold text-white/60">
                Yarışma tamamlandı. İlk 3&apos;e giren öğrencilere başarı sertifikası oluşturabilirsiniz.
              </p>
            </div>

            {/* Podium Visual (1st, 2nd, 3rd) */}
            <div className="flex items-end justify-center gap-3 sm:gap-6 pt-8 w-full max-w-lg">
              {/* 2nd Place */}
              {sortedStudents[1] && (
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-2xl mb-1">{sortedStudents[1].avatar}</span>
                  <p className="text-xs font-black text-white line-clamp-1">{sortedStudents[1].name}</p>
                  <span className="text-[0.68rem] font-mono text-slate-400">{sortedStudents[1].score} P</span>
                  <div className="mt-2 w-full rounded-t-2xl bg-gradient-to-t from-slate-700 to-slate-500 h-28 flex items-center justify-center text-2xl font-black text-white shadow-lg">
                    2
                  </div>
                </div>
              )}

              {/* 1st Place (Winner) */}
              {sortedStudents[0] && (
                <div className="flex-1 flex flex-col items-center -mt-6">
                  <Crown className="size-8 text-amber-400 animate-bounce mb-1" />
                  <span className="text-3xl mb-1">{sortedStudents[0].avatar}</span>
                  <p className="text-sm font-black text-amber-300 line-clamp-1">{sortedStudents[0].name}</p>
                  <span className="text-xs font-mono font-bold text-amber-400">{sortedStudents[0].score} P</span>
                  <div className="mt-2 w-full rounded-t-2xl bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-400 h-40 flex items-center justify-center text-3xl font-black text-amber-950 shadow-xl">
                    1
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {sortedStudents[2] && (
                <div className="flex-1 flex flex-col items-center">
                  <span className="text-2xl mb-1">{sortedStudents[2].avatar}</span>
                  <p className="text-xs font-black text-white line-clamp-1">{sortedStudents[2].name}</p>
                  <span className="text-[0.68rem] font-mono text-slate-400">{sortedStudents[2].score} P</span>
                  <div className="mt-2 w-full rounded-t-2xl bg-gradient-to-t from-amber-900 to-amber-700 h-20 flex items-center justify-center text-xl font-black text-white shadow-md">
                    3
                  </div>
                </div>
              )}
            </div>

            {/* Actions: Generate Certificate & Restart */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              {sortedStudents[0] && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWinner({ name: sortedStudents[0].name, score: sortedStudents[0].score });
                    setCertModalOpen(true);
                    triggerHaptic("success");
                  }}
                  className="tap-scale flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3 text-xs font-black text-amber-950 shadow-lg hover:brightness-110 transition"
                >
                  <Award className="size-4" />
                  <span>Şampiyona Altın Sertifika Ver</span>
                </button>
              )}

              <button
                type="button"
                onClick={restartLive}
                className="tap-scale flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-xs font-black text-white hover:bg-white/20 transition"
              >
                <RotateCcw className="size-4" />
                <span>Yeni Tur Başlat</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-white/10 bg-slate-900/60 px-6 py-3 text-center text-xs text-white/40">
        Zigo Canlı Sınıf Arenası · Türkiye MEB Müfredatı ile Tam Uyumlu
      </footer>

      {/* Winner Certificate Modal */}
      {selectedWinner && (
        <CertificateModal
          isOpen={certModalOpen}
          onClose={() => setCertModalOpen(false)}
          data={{
            studentName: selectedWinner.name,
            quizTitle: "Canlı Quiz Arenası 1.si",
            score: selectedWinner.score,
            maxScore: 1000,
            correct: 4,
            total: 4,
            teacherName: "Zigo Öğretmen",
            teacherTitle: "Ders Öğretmeni",
          }}
        />
      )}
    </div>
  );
}
