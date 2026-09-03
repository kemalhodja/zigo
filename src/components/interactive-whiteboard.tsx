"use client";

import { useEffect, useRef, useState } from "react";

type InteractiveWhiteboardProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
};

export function InteractiveWhiteboard({
  isOpen,
  onClose,
  title = "İşlem & Karalama Tahtası",
}: InteractiveWhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState<string>("#2563eb"); // Mavi varsayılan
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to parent bounds
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Set background to grid or clean white
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Initial state saved to history
    setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.strokeStyle = isEraser ? "#ffffff" : color;
    ctx.lineWidth = isEraser ? lineWidth * 4 : lineWidth;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.closePath();
    // Save to history for Undo
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), current]);
  };

  const undo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newHistory = history.slice(0, -1);
    const prevState = newHistory[newHistory.length - 1];
    ctx.putImageData(prevState, 0, 0);
    setHistory(newHistory);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    const clearedState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([clearedState]);
  };

  const colors = ["#2563eb", "#dc2626", "#16a34a", "#0f172a", "#9333ea"];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden bg-white shadow-2xl md:my-6 md:rounded-3xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-violet-100 text-violet-700 text-sm">
              ✏️
            </span>
            <h2 className="text-sm font-black text-slate-800">{title}</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={undo}
              disabled={history.length <= 1}
              className="tap-scale flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
              title="Geri Al"
            >
              <span>↩️</span>
              <span className="hidden sm:inline">Geri Al</span>
            </button>
            <button
              onClick={clear}
              className="tap-scale flex items-center gap-1 rounded-xl bg-white border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
              title="Temizle"
            >
              <span>🗑️</span>
              <span className="hidden sm:inline">Temizle</span>
            </button>
            <button
              onClick={onClose}
              className="tap-scale flex size-8 items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 font-black text-sm ml-2 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="relative flex-1 w-full bg-white touch-none cursor-crosshair overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full block"
          />
        </div>

        {/* Toolbar Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 bg-slate-50">
          {/* Color options */}
          <div className="flex items-center gap-1.5">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setIsEraser(false);
                }}
                className={`size-7 rounded-full transition-transform ${
                  !isEraser && color === c ? "scale-125 ring-2 ring-violet-500 ring-offset-2" : "hover:scale-110"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <button
              onClick={() => setIsEraser(true)}
              className={`ml-1.5 tap-scale flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition ${
                isEraser
                  ? "bg-violet-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>🧼</span>
              <span>Silgi</span>
            </button>
          </div>

          {/* Stroke Width Slider */}
          <div className="flex items-center gap-2">
            <span className="text-[0.65rem] font-black uppercase text-slate-400">Kalınlık</span>
            <input
              type="range"
              min="1"
              max="10"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-20 accent-violet-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
