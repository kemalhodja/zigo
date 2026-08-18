"use client";

import { memo } from "react";

type MemoryCardProps = {
  id: string;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
  isError?: boolean;
  onClick: (id: string) => void;
};

export const MemoryCard = memo(function MemoryCard({
  id,
  icon,
  isFlipped,
  isMatched,
  isError = false,
  onClick,
}: MemoryCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      disabled={isFlipped || isMatched}
      className={`relative aspect-square w-full rounded-2xl transition-all duration-300 transform-gpu preserve-3d focus:outline-none tap-scale ${
        isFlipped || isMatched ? "rotate-y-180" : ""
      } ${isMatched ? "cursor-default" : "cursor-pointer"} ${isError ? "animate-shake" : ""}`}
    >
      {/* Arka Yüz (Kapalı) */}
      <div
        className={`absolute inset-0 flex items-center justify-center rounded-2xl backface-hidden ${
          isMatched
            ? "hidden"
            : "bg-gradient-to-br from-violet-600 to-indigo-700 shadow-lg shadow-violet-500/30 border border-violet-400/30"
        }`}
      >
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-2xl opacity-30">🌟</span>
        </div>
      </div>

      {/* Ön Yüz (Açık) */}
      <div
        className={`absolute inset-0 flex items-center justify-center rounded-2xl backface-hidden rotate-y-180 ${
          isMatched
            ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30 border border-emerald-300/50"
            : isError
            ? "bg-red-50 shadow-md border-2 border-red-400"
            : "bg-white shadow-md border-2 border-indigo-200"
        }`}
      >
        <span
          className={`text-3xl sm:text-4xl transition-all duration-300 ${
            isMatched ? "scale-90 drop-shadow-sm" : "scale-100"
          }`}
        >
          {icon}
        </span>
      </div>
    </button>
  );
});
