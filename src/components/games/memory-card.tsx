"use client";

import { memo } from "react";

type MemoryCardProps = {
  id: string;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
  onClick: (id: string) => void;
};

export const MemoryCard = memo(function MemoryCard({
  id,
  icon,
  isFlipped,
  isMatched,
  onClick,
}: MemoryCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      disabled={isFlipped || isMatched}
      className={`relative aspect-square w-full rounded-2xl shadow-sm transition-transform duration-300 transform-gpu preserve-3d tap-scale focus:outline-none focus:ring-4 focus:ring-emerald-500/50 ${
        isFlipped || isMatched ? "rotate-y-180" : ""
      }`}
    >
      {/* Arka Yüz (Kapalı Durum) */}
      <div
        className={`absolute inset-0 flex items-center justify-center rounded-2xl backface-hidden ${
          isMatched ? "hidden" : "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md"
        }`}
      >
        <span className="text-3xl font-black text-white/30">?</span>
      </div>

      {/* Ön Yüz (Açık Durum) */}
      <div
        className={`absolute inset-0 flex items-center justify-center rounded-2xl backface-hidden rotate-y-180 ${
          isMatched
            ? "bg-emerald-100 shadow-inner"
            : "bg-white shadow-md border-2 border-indigo-100"
        }`}
      >
        <span
          className={`text-4xl sm:text-5xl transition-opacity duration-500 ${
            isMatched ? "opacity-50 grayscale" : "opacity-100"
          }`}
        >
          {icon}
        </span>
      </div>
    </button>
  );
});
