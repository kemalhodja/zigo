"use client";

import { useEffect, useRef, useState } from "react";
import { Award, ExternalLink, Minimize2, Pause, Play, RotateCcw, Timer, X } from "lucide-react";

interface PipPomodoroWidgetProps {
  initialSeconds?: number;
  topic?: string;
  onSessionComplete?: () => void;
}

export function PipPomodoroWidget({
  initialSeconds = 1500, // 25 min default
  topic = "MEB Odaklanma Seansı",
  onSessionComplete,
}: PipPomodoroWidgetProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            setIsRunning(false);
            if (onSessionComplete) onSessionComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft, onSessionComplete]);

  // Format time mm:ss
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // Native Picture-in-Picture via Canvas Stream
  async function triggerNativePip() {
    try {
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 250;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, 400, 250);
        ctx.fillStyle = "#a855f7";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText("ZIGO ODAK MODU", 30, 50);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 64px sans-serif";
        ctx.fillText(timeFormatted, 30, 130);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "16px sans-serif";
        ctx.fillText(topic, 30, 180);
      }

      if (!videoRef.current) {
        const video = document.createElement("video");
        video.muted = true;
        const canvasWithStream = canvas as HTMLCanvasElement & { captureStream?: (fps: number) => MediaStream };
        const stream = typeof canvasWithStream.captureStream === "function" ? canvasWithStream.captureStream(10) : null;
        if (stream) {
          video.srcObject = stream;
          await video.play();
          videoRef.current = video;
          await video.requestPictureInPicture();
        }
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {
      // Fallback: floating in-page widget is already active!
    }
  }

  if (!isVisible) {
    return (
      <div className="hidden lg:block fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => {
            setIsVisible(true);
            setIsRunning(true);
          }}
          className="tap-scale flex items-center gap-2.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-xs font-black text-white shadow-xl hover:brightness-110"
        >
          <Timer className="size-4 animate-spin" style={{ animationDuration: "12s" }} />
          <span>📌 Yüzen Pomodoro & PiP Sayacı</span>
        </button>
      </div>
    );
  }

  return (
    <div className="hidden lg:block fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom-5 duration-200">
      <div className="w-80 rounded-3xl border border-slate-700/80 bg-slate-900/95 p-5 text-white shadow-2xl backdrop-blur-md">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-violet-600 text-xs">
              ⏱️
            </span>
            <span className="text-xs font-black text-slate-200 truncate max-w-[130px]">{topic}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={triggerNativePip}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              title="Ayrı Küçük Pencerede Aç (PiP)"
            >
              <ExternalLink className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsMinimized((m) => !m)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              title="Küçült"
            >
              <Minimize2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRunning(false);
                setIsVisible(false);
              }}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              title="Kapat"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Minimized view */}
        {isMinimized ? (
          <div className="flex items-center justify-between pt-3">
            <span className="text-xl font-black font-mono text-violet-400">{timeFormatted}</span>
            <button
              type="button"
              onClick={() => setIsRunning((r) => !r)}
              className="rounded-xl bg-violet-600 px-3 py-1 text-xs font-black"
            >
              {isRunning ? "Durdur" : "Başlat"}
            </button>
          </div>
        ) : (
          /* Full widget view */
          <div className="mt-4 space-y-3">
            <div className="text-center">
              <span className="text-4xl font-black font-mono tracking-wider text-white">
                {timeFormatted}
              </span>
              <p className="mt-1 text-[0.65rem] font-bold text-slate-400">
                YouTube veya diğer sekmelerdeyken de sayacınız işler
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRunning((r) => !r)}
                className={`tap-scale flex items-center gap-2 rounded-2xl px-6 py-2.5 text-xs font-black shadow-md ${
                  isRunning
                    ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                    : "bg-violet-600 text-white hover:bg-violet-500"
                }`}
              >
                {isRunning ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                <span>{isRunning ? "Duraklat" : "Odaklan"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSecondsLeft(initialSeconds);
                  setIsRunning(false);
                }}
                className="rounded-2xl border border-slate-700 bg-slate-800 p-2.5 text-slate-300 hover:bg-slate-700 hover:text-white"
                title="Sıfırla"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-800/80 px-3 py-2 text-[0.65rem] font-bold text-slate-300">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Award className="size-3" />
                <span>Seans Sonu Ödülü</span>
              </div>
              <span className="font-black text-emerald-400">+25 Lig Puanı</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
