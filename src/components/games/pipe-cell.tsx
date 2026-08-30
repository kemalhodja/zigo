"use client";

import { memo } from "react";

export type PipeType = "straight" | "corner" | "cross" | "t_junction" | "source" | "target" | "empty";

type PipeCellProps = {
  type: PipeType;
  rotation: number; // 0, 90, 180, 270
  isFilled: boolean;
  flowDistance?: number;
  onClick: () => void;
  disabled?: boolean;
};

export const PipeCell = memo(function PipeCell({
  type,
  rotation,
  isFilled,
  flowDistance = -1,
  onClick,
  disabled,
}: PipeCellProps) {
  if (type === "empty") {
    return <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-900/50 border border-white/5" />;
  }

  // Akış rengi: Enerji/Su akıyorsa cyan/mavi neon, akmıyorsa gri/slate
  const pipeColor = isFilled 
    ? "bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_0_15px_rgba(34,211,238,0.8)]" 
    : "bg-gradient-to-r from-slate-500 to-slate-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]";
  
  const glowBorder = isFilled ? "border-cyan-300" : "border-slate-500";
  const delayStyle = flowDistance >= 0 ? { transitionDelay: `${flowDistance * 100}ms` } : {};
  const duration = "duration-500";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || type === "source" || type === "target"}
      className={`tap-scale w-12 h-12 sm:w-14 sm:h-14 rounded-2xl relative flex items-center justify-center transition-transform duration-300 select-none overflow-hidden ${
        type === "source"
          ? "bg-emerald-500 shadow-md ring-4 ring-emerald-200"
          : type === "target"
          ? isFilled
            ? "bg-amber-400 shadow-lg ring-4 ring-amber-200 animate-pulse"
            : "bg-amber-500/80 ring-2 ring-amber-300"
          : "bg-slate-800 hover:bg-slate-700 shadow-sm"
      }`}
    >
      {/* Özel İkonlar */}
      {type === "source" && (
        <span className="text-xl sm:text-2xl z-10 select-none animate-bounce">⚡</span>
      )}
      {type === "target" && (
        <span className="text-xl sm:text-2xl z-10 select-none">🎯</span>
      )}

      {/* Dönen Boru Grafiği */}
      {type !== "source" && type !== "target" && (
        <div
          className="w-full h-full relative transition-transform duration-300"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Straight Pipe: Düz çizgi (dikey) */}
          {type === "straight" && (
            <div className={`absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-3.5 sm:w-4 ${pipeColor} border-x ${glowBorder} transition-all ${duration}`} style={delayStyle} />
          )}

          {/* Corner Pipe: L Boru (Üstten Sağa) */}
          {type === "corner" && (
            <>
              <div className={`absolute left-1/2 -translate-x-1/2 top-0 h-1/2 w-3.5 sm:w-4 ${pipeColor} border-x ${glowBorder} transition-all ${duration}`} style={delayStyle} />
              <div className={`absolute top-1/2 -translate-y-1/2 right-0 w-1/2 h-3.5 sm:h-4 ${pipeColor} border-y ${glowBorder} transition-all ${duration}`} style={delayStyle} />
              {/* Ortadaki Köşe Bağlantısı */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-br-xs ${pipeColor} transition-all ${duration}`} style={delayStyle} />
            </>
          )}

          {/* T-Junction Pipe: T Birleşim (Sol, Sağ, Alt) */}
          {type === "t_junction" && (
            <>
              <div className={`absolute top-1/2 -translate-y-1/2 left-0 right-0 h-3.5 sm:h-4 ${pipeColor} border-y ${glowBorder} transition-all ${duration}`} style={delayStyle} />
              <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-1/2 w-3.5 sm:w-4 ${pipeColor} border-x ${glowBorder} transition-all ${duration}`} style={delayStyle} />
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 ${pipeColor} transition-all ${duration}`} style={delayStyle} />
            </>
          )}

          {/* Cross Pipe: Artı Boru (+) */}
          {type === "cross" && (
            <>
              <div className={`absolute top-1/2 -translate-y-1/2 left-0 right-0 h-3.5 sm:h-4 ${pipeColor} border-y ${glowBorder} transition-all ${duration}`} style={delayStyle} />
              <div className={`absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-3.5 sm:w-4 ${pipeColor} border-x ${glowBorder} transition-all ${duration}`} style={delayStyle} />
            </>
          )}
        </div>
      )}
    </button>
  );
});
