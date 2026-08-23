"use client";

import { useAudio } from "@/hooks/use-audio";

type GameSoundToggleProps = {
  className?: string;
};

const BASE_STYLES =
  "tap-scale bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-2 py-1 text-xs font-bold text-white transition-colors";

export function GameSoundToggle({ className = "" }: GameSoundToggleProps) {
  const { isMuted, toggleAudio } = useAudio();

  return (
    <button
      type="button"
      onClick={toggleAudio}
      aria-label={isMuted ? "Sesi aç" : "Sesi kapat"}
      aria-pressed={!isMuted}
      title={isMuted ? "Sesi aç" : "Sesi kapat"}
      className={`${BASE_STYLES} ${className}`.trim()}
    >
      <span aria-hidden="true">{isMuted ? "🔇" : "🔊"}</span>
    </button>
  );
}
