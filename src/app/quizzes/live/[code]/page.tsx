"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CheckCircle2, Clock, Sparkles, Trophy, Users, XCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ code: string }>;
}

const AVATARS = ["👩‍🎓", "👨‍🎓", "⭐", "🚀", "🦊", "⚡", "🎯", "🦁"];

export default function StudentLiveQuizPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const code = decodeURIComponent(resolvedParams.code || "");

  const [studentName, setStudentName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("👩‍🎓");
  const [joined, setJoined] = useState(false);
  const [phase, setPhase] = useState<"lobby" | "question" | "answered" | "review" | "podium">("lobby");
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  // Restore name from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem("zigo_live_student_name");
      if (saved) setStudentName(saved);
    } catch {}
  }, []);

  function triggerHaptic(type: "click" | "success" | "warn" = "click") {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      if (type === "click") navigator.vibrate(8);
      else if (type === "success") navigator.vibrate([20, 50, 20]);
      else if (type === "warn") navigator.vibrate([40, 30, 40]);
    }
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!studentName.trim()) return;
    triggerHaptic("success");
    try {
      localStorage.setItem("zigo_live_student_name", studentName.trim());
    } catch {}
    setJoined(true);
    // Simulate teacher starting question after 3 seconds in demo
    setTimeout(() => {
      setPhase("question");
    }, 3000);
  }

  function handleAnswer(index: number) {
    setSelectedOption(index);
    setPhase("answered");
    triggerHaptic("click");

    // Simulate review round after 2 seconds
    setTimeout(() => {
      const isCorrect = index === 1; // Sample correct index
      setLastCorrect(isCorrect);
      if (isCorrect) {
        setScore((s) => s + 850);
        triggerHaptic("success");
      } else {
        triggerHaptic("warn");
      }
      setPhase("review");
    }, 2000);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 selection:bg-indigo-500">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => router.push("/quizzes")}
          className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-white/80 hover:bg-white/20"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="text-center">
          <span className="text-[0.62rem] font-bold text-white/50 uppercase tracking-widest">Oda PIN</span>
          <p className="text-sm font-black font-mono text-amber-300">{code || "Canlı Oda"}</p>
        </div>
        <div className="rounded-xl bg-white/10 px-2.5 py-1 text-xs font-black font-mono text-indigo-300">
          {score} Puan
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full py-6">
        {/* Screen 1: Name and Avatar Entry */}
        {!joined ? (
          <form onSubmit={handleJoin} className="w-full space-y-6 text-center animate-in fade-in">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-400">Canlı Sınıf Quiz</span>
              <h2 className="text-2xl font-black text-white">Yarışmaya Katıl</h2>
              <p className="text-xs text-white/60">Öğretmeninin başlattığı teste adınla katıl:</p>
            </div>

            {/* Avatar Selector */}
            <div className="flex flex-wrap justify-center gap-2">
              {AVATARS.map((av) => (
                <button
                  type="button"
                  key={av}
                  onClick={() => {
                    setSelectedAvatar(av);
                    triggerHaptic("click");
                  }}
                  className={`flex size-11 items-center justify-center rounded-2xl text-xl border transition ${
                    selectedAvatar === av
                      ? "border-amber-400 bg-amber-400/20 scale-110 shadow-sm"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>

            <div>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Adın ve Soyadın..."
                maxLength={30}
                className="w-full rounded-2xl border border-white/20 bg-white/10 p-4 text-center text-base font-black text-white placeholder-white/40 outline-none focus:border-indigo-400 focus:bg-white/15"
              />
            </div>

            <button
              type="submit"
              disabled={!studentName.trim()}
              className="tap-scale flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 py-4 text-sm font-black text-white shadow-lg hover:brightness-110 disabled:opacity-50 transition"
            >
              <span>{selectedAvatar} Odaya Katıl</span>
            </button>
          </form>
        ) : phase === "lobby" ? (
          /* Screen 2: Waiting in Lobby */
          <div className="text-center space-y-4 animate-in zoom-in-95">
            <div className="flex size-20 items-center justify-center rounded-3xl bg-indigo-500/20 border border-indigo-500/30 text-4xl mx-auto animate-bounce">
              {selectedAvatar}
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{studentName}</h3>
              <p className="text-xs font-semibold text-emerald-400 mt-1">● Odaya Başarıyla Katıldın!</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs font-medium text-white/70 max-w-xs mx-auto">
              Öğretmeninin soruyu akıllı tahtadan başlatması bekleniyor... Hazır ol!
            </div>
          </div>
        ) : phase === "question" ? (
          /* Screen 3: Big 4 Buzzer Buttons */
          <div className="w-full space-y-3 animate-in fade-in">
            <div className="text-center mb-2">
              <span className="text-xs font-black text-amber-300">Akıllı Tahtadaki Soruya Göre Cevabını Seç:</span>
            </div>
            <div className="grid grid-cols-2 gap-3 h-[320px]">
              <button
                type="button"
                onClick={() => handleAnswer(0)}
                className="tap-scale flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-lg active:scale-95 transition"
              >
                <span className="text-4xl font-black">▲</span>
                <span className="text-xs font-black mt-2">A ŞIKKI</span>
              </button>

              <button
                type="button"
                onClick={() => handleAnswer(1)}
                className="tap-scale flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg active:scale-95 transition"
              >
                <span className="text-4xl font-black">◆</span>
                <span className="text-xs font-black mt-2">B ŞIKKI</span>
              </button>

              <button
                type="button"
                onClick={() => handleAnswer(2)}
                className="tap-scale flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg active:scale-95 transition"
              >
                <span className="text-4xl font-black">●</span>
                <span className="text-xs font-black mt-2">C ŞIKKI</span>
              </button>

              <button
                type="button"
                onClick={() => handleAnswer(3)}
                className="tap-scale flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg active:scale-95 transition"
              >
                <span className="text-4xl font-black">■</span>
                <span className="text-xs font-black mt-2">D ŞIKKI</span>
              </button>
            </div>
          </div>
        ) : phase === "answered" ? (
          /* Screen 4: Answer Submitted, Waiting */
          <div className="text-center space-y-3 animate-in zoom-in-95">
            <div className="flex size-16 items-center justify-center rounded-3xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 mx-auto">
              <Clock className="size-8 animate-spin" />
            </div>
            <h3 className="text-lg font-black text-white">Cevabın Alındı!</h3>
            <p className="text-xs text-white/60">Diğer öğrencilerin cevaplaması bekleniyor...</p>
          </div>
        ) : (
          /* Screen 5: Review & Score Feedback */
          <div className="text-center space-y-4 animate-in zoom-in-95">
            {lastCorrect ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="flex size-20 items-center justify-center rounded-3xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shadow-lg">
                  <CheckCircle2 className="size-12" />
                </div>
                <h3 className="text-2xl font-black text-emerald-400">Harika! Doğru Cevap</h3>
                <span className="rounded-full bg-emerald-500/20 px-4 py-1 text-sm font-black text-emerald-300">
                  +850 Puan
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="flex size-20 items-center justify-center rounded-3xl bg-rose-500/20 border border-rose-500/30 text-rose-400 shadow-lg">
                  <XCircle className="size-12" />
                </div>
                <h3 className="text-2xl font-black text-rose-400">Bu Sefer Olmadı</h3>
                <p className="text-xs text-white/60">Bir sonraki soruda daha hızlı davranabilirsin!</p>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs font-bold text-white/80">
              Toplam Puanın: <strong className="text-amber-300 font-mono text-sm">{score}</strong>
            </div>
          </div>
        )}
      </main>

      <footer className="text-center text-[0.68rem] text-white/30 pb-2">
        Zigo Canlı Quiz Arenası · Öğrenci Katılım Ekranı
      </footer>
    </div>
  );
}
