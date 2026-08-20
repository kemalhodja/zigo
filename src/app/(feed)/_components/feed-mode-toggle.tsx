"use client";

interface FeedModeToggleProps {
  mode: "summary" | "infinite";
  onChange: (mode: "summary" | "infinite") => void;
}

export function FeedModeToggle({ mode, onChange }: FeedModeToggleProps) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.02)] backdrop-blur-xl">
      <span className="text-[13px] font-black uppercase tracking-wider text-slate-500">Akış Modu</span>
      <div className="relative flex items-center rounded-xl bg-slate-100/80 p-1 shadow-inner">
        <button
          onClick={() => onChange("summary")}
          className={`relative z-10 rounded-lg px-4 py-1.5 text-xs font-bold transition-all duration-300 ${
            mode === "summary"
              ? "text-slate-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Günlük Özet
        </button>
        <button
          onClick={() => onChange("infinite")}
          className={`relative z-10 rounded-lg px-4 py-1.5 text-xs font-bold transition-all duration-300 ${
            mode === "infinite"
              ? "text-slate-900"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Sürekli Akış
        </button>
        
        {/* Animated Background Pill */}
        <div 
          className={`absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm transition-all duration-300 ease-out ${
            mode === "summary" ? "left-1" : "translate-x-[calc(100%+2px)]"
          }`} 
        />
      </div>
    </div>
  );
}
