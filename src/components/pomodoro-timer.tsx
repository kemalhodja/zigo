"use client";

import { useEffect, useState } from "react";

import { useToast } from "@/components/ui/toast-system";
import { triggerConfetti } from "@/lib/client/confetti";

export function PomodoroTimer() {
  const toast = useToast();
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");
  const [completedSessions, setCompletedSessions] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      if (mode === "work") {
        setCompletedSessions((prev) => prev + 1);
        triggerConfetti();

        // Backend'den gerek puan almak iin API'ye istek gnderiyoruz
        void fetch("/api/learning/pomodoro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
          .then((res) => res.json())
          .then((data: { error?: string }) => {
            if (data.error) {
              console.error(data.error);
            }
          })
          .catch((err) => console.error(err));

        toast.success("✨ Harika! 25 Dakikalık Odaklanma Seansı Tamamlandı. +50 XP Kazandınız!", "Tebrikler!");
        setMode("break");
        setTimeLeft(5 * 60); // 5 min break
      } else {
        toast.showToast("☕ Mola Süresi Bitti! Yeniden Odaklanmaya Hazır mısınız?", "info", "Mola Bitti");
        setMode("work");
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode, toast]);

  function toggleTimer() {
    setIsRunning(!isRunning);
  }

  function resetTimer() {
    setIsRunning(false);
    setTimeLeft(mode === "work" ? 25 * 60 : 5 * 60);
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent =
    mode === "work"
      ? ((25 * 60 - timeLeft) / (25 * 60)) * 100
      : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <div className="-mx-4 overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-night via-violet-950 to-slate-900 p-6 text-white shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <span className="rounded-full bg-amber-400/20 px-3 py-1 text-[0.65rem] font-black uppercase tracking-wider text-amber-300">
            {mode === "work" ? "🧠 Pomodoro Odaklanma Modu" : "☕ Dinlenme Molası"}
          </span>
          <h3 className="mt-1 text-lg font-black">
            {mode === "work" ? "25 Dk Kesintisiz Ders Çalış" : "5 Dk Zihini Dinlendir"}
          </h3>
        </div>
        <div className="text-right">
          <span className="text-[0.65rem] font-extrabold uppercase text-slate-400 block">Tamamlanan</span>
          <span className="text-base font-black text-amber-400">🔥 {completedSessions} Seans</span>
        </div>
      </div>

      {/* Timer Counter Circle */}
      <div className="my-6 flex flex-col items-center justify-center">
        <div className="relative flex size-44 items-center justify-center rounded-full bg-slate-900/90 border-4 border-slate-800 shadow-2xl">
          <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-slate-800"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className={mode === "work" ? "stroke-amber-400" : "stroke-emerald-400"}
              strokeWidth="6"
              strokeDasharray="276"
              strokeDashoffset={276 - (276 * progressPercent) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="text-center z-10">
            <span className="text-4xl font-black font-mono tracking-tight text-white">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            <span className="block mt-1 text-[0.68rem] font-bold text-amber-300">
              {isRunning ? "⏱️ Odaklanılıyor..." : "⏸️ Duraklatıldı"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={toggleTimer}
          className={`tap-scale rounded-2xl px-6 py-3 text-xs font-black transition shadow-lg ${
            isRunning
              ? "bg-rose-500 text-white hover:bg-rose-600"
              : "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:brightness-105"
          }`}
        >
          {isRunning ? "⏸️ Duraklat" : "🚀 Başlat (+50 XP)"}
        </button>
        <button
          type="button"
          onClick={resetTimer}
          className="tap-scale rounded-2xl bg-slate-800 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700"
        >
          🔄 Sıfırla
        </button>
      </div>
    </div>
  );
}
