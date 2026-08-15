import Link from "next/link";

export function MiniGamesArcadeSection({
  className = "",
  isPremium = true,
}: {
  className?: string;
  isPremium?: boolean;
}) {
  return (
    <section className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span>🎮</span> Zigo Zeka Oyunları Salonu {!isPremium && <span className="text-amber-500">🔒</span>}
          </h2>
          <p className="text-[0.7rem] font-bold text-slate-400">
            {isPremium
              ? "Zihnini dinlendir, odaklan ve Zigo Puanı (XP) kazan!"
              : "30 günlük deneme süresi doldu. Oyunları açmak için abone olun."}
          </p>
        </div>
        <span className={`text-[0.65rem] font-black px-2 py-0.5 rounded-md border ${
          isPremium ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-amber-50 text-amber-700 border-amber-200"
        }`}>
          {isPremium ? "3 Mini Oyun" : "Kilitli 🔒"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Oyun 1: Zihin Avcısı (Hafıza) */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-3.5 py-3.5 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>🧠</span> Zihin Avcısı
              </h3>
              <p className="text-indigo-100 text-[0.62rem] font-bold mt-0.5">Görsel Hafıza</p>
            </div>
            <Link
              href="/student/games/memory"
              className="tap-scale shrink-0 bg-white text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs hover:bg-indigo-50 transition-colors"
            >
              Oyna
            </Link>
          </div>
          <div className="absolute top-0 right-0 -mr-4 -mt-4 text-white/10 text-6xl transform rotate-12 transition-transform group-hover:scale-110 pointer-events-none">
            🧠
          </div>
        </div>

        {/* Oyun 2: Blok Zeka (Mekansal) */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-3.5 py-3.5 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>🧩</span> Blok Zeka
              </h3>
              <p className="text-emerald-100 text-[0.62rem] font-bold mt-0.5">Mekansal Strateji</p>
            </div>
            <Link
              href="/student/games/blocks"
              className="tap-scale shrink-0 bg-white text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs hover:bg-emerald-50 transition-colors"
            >
              Oyna
            </Link>
          </div>
          <div className="absolute top-0 right-0 -mr-4 -mt-4 text-white/10 text-6xl transform -rotate-12 transition-transform group-hover:scale-110 pointer-events-none">
            🧩
          </div>
        </div>

        {/* Oyun 3: Akış Yolu (Mantık) */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-700 px-3.5 py-3.5 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>⚡</span> Akış Yolu
              </h3>
              <p className="text-cyan-100 text-[0.62rem] font-bold mt-0.5">Mantık & Akış</p>
            </div>
            <Link
              href="/student/games/pipe"
              className="tap-scale shrink-0 bg-white text-cyan-700 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs hover:bg-cyan-50 transition-colors"
            >
              Oyna
            </Link>
          </div>
          <div className="absolute top-0 right-0 -mr-4 -mt-4 text-white/10 text-6xl transform rotate-6 transition-transform group-hover:scale-110 pointer-events-none">
            ⚡
          </div>
        </div>
      </div>
    </section>
  );
}
