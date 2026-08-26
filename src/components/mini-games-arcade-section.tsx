import Link from "next/link";

export function MiniGamesArcadeSection({
  className = "",
  isPremium = true,
  isStudent = false,
}: {
  className?: string;
  isPremium?: boolean;
  isStudent?: boolean;
}) {
  const subtitle = !isPremium
    ? "30 günlük deneme süresi doldu. Oyunları açmak için abone olun."
    : isStudent
      ? "Günde 1 saat · 08:00–22:00 · Zigo Puanı (XP) kazan!"
      : "Zihnini dinlendir, odaklan ve Zigo Puanı (XP) kazan!";

  return (
    <section className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span>🎮</span> Zigo Zeka Oyunları Salonu {!isPremium && <span className="text-amber-500">🔒</span>}
          </h2>
          <p className="text-[0.7rem] font-bold text-slate-400">
            {subtitle}
          </p>
        </div>
        <span className={`text-[0.65rem] font-black px-2 py-0.5 rounded-md border ${
          isPremium ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-amber-50 text-amber-700 border-amber-200"
        }`}>
          {isPremium ? "5 Mini Oyun" : "Kilitli 🔒"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {/* Oyun 1: Zihin Avcısı (Hafıza) */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-3.5 py-3.5 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>🧠</span> Zihin Avcısı
              </h3>
              <p className="text-indigo-100 text-[0.62rem] font-bold mt-0.5">Görsel Hafıza</p>
                <div className="mt-2 flex items-center gap-1 text-[0.55rem] font-black text-white/80 bg-black/20 w-fit px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                  <span aria-hidden="true">🏆</span>
                  Sonsuz seviye · Rekor takibi
                </div>
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
              <div className="mt-2 flex items-center gap-1 text-[0.55rem] font-black text-white/80 bg-black/20 w-fit px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                <span aria-hidden="true">⚡</span>
                Combo bonusu · Seviye atlama
              </div>
            </div>
            <Link
              href="/student/games/blocks"              className="tap-scale shrink-0 bg-white text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs hover:bg-emerald-50 transition-colors"
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
              <div className="mt-2 flex items-center gap-1 text-[0.55rem] font-black text-white/80 bg-black/20 w-fit px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                <span aria-hidden="true">🗺️</span>
                15 bölüm + ∞ sonsuz mod
              </div>
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

        {/* Oyun 4: Matematik Ustası (Hız & Analitik) */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-3.5 py-3.5 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>🧮</span> Matematik Ustası
              </h3>
              <p className="text-rose-100 text-[0.62rem] font-bold mt-0.5">Analitik Düşünce</p>
              <div className="mt-2 flex items-center gap-1 text-[0.55rem] font-black text-white/80 bg-black/20 w-fit px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                <span aria-hidden="true">🧠</span>
                Klasik + 8. Sınıf müfredatı
              </div>
            </div>
            <Link
              href="/student/games/math"
              className="tap-scale shrink-0 bg-white text-rose-700 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs hover:bg-rose-50 transition-colors"
            >
              Oyna
            </Link>
          </div>
          <div className="absolute top-0 right-0 -mr-4 -mt-4 text-white/10 text-6xl transform -rotate-6 transition-transform group-hover:scale-110 pointer-events-none">
            🧮
          </div>
        </div>

        {/* Oyun 5: Kelime Avı (Sözel Zeka) */}
        <div className="bg-gradient-to-r from-teal-500 to-emerald-600 px-3.5 py-3.5 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>🔤</span> Kelime Avı
              </h3>
              <p className="text-teal-100 text-[0.62rem] font-bold mt-0.5">Sözel Zeka</p>
              <div className="mt-2 flex items-center gap-1 text-[0.55rem] font-black text-white/80 bg-black/20 w-fit px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                <span aria-hidden="true">📚</span>
                TR &amp; EN · Kelime anlamları
              </div>
            </div>
            <Link
              href="/student/games/word"
              className="tap-scale shrink-0 bg-white text-teal-700 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs hover:bg-teal-50 transition-colors"
            >
              Oyna
            </Link>
          </div>
          <div className="absolute top-0 right-0 -mr-4 -mt-4 text-white/10 text-6xl transform rotate-12 transition-transform group-hover:scale-110 pointer-events-none">
            🔤
          </div>
        </div>

        {/* Oyun 6: Yapboz Düşüşü (Görsel-Mekânsal Zeka) */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-3.5 py-3.5 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>🧩</span> Yapboz Düşüşü
              </h3>
              <p className="text-teal-100 text-[0.62rem] font-bold mt-0.5">Görsel-Mekânsal Zeka</p>
              <div className="mt-2 flex items-center gap-1 text-[0.55rem] font-black text-white/80 bg-black/20 w-fit px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                <span aria-hidden="true">🃏</span>
                Sürükle · Takas · Combo
              </div>
            </div>
            <Link
              href="/student/games/jigsaw"
              className="tap-scale shrink-0 bg-white text-teal-700 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs hover:bg-teal-50 transition-colors"
            >
              Oyna
            </Link>
          </div>
          <div className="absolute top-0 right-0 -mr-4 -mt-4 text-white/10 text-6xl transform -rotate-6 transition-transform group-hover:scale-110 pointer-events-none">
            🧩
          </div>
        </div>


        {/* Oyun 7: Zigo Tabu (Yasak Kelime) */}
        <div className="bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3.5 py-3.5 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>🗣️</span> Zigo Tabu
              </h3>
              <p className="text-fuchsia-100 text-[0.62rem] font-bold mt-0.5">Yapay Zekaya Karşı</p>
              <div className="mt-2 flex items-center gap-1 text-[0.55rem] font-black text-white/80 bg-black/20 w-fit px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                <span aria-hidden="true">🤖</span>
                Müfredat kelimeleri · Zamana karşı
              </div>
            </div>
            <Link
              href="/student/games/taboo"
              className="tap-scale shrink-0 bg-white text-fuchsia-700 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs hover:bg-fuchsia-50 transition-colors"
            >
              Oyna
            </Link>
          </div>
          <div className="absolute top-0 right-0 -mr-4 -mt-4 text-white/10 text-6xl transform rotate-12 transition-transform group-hover:scale-110 pointer-events-none">
            🗣️
          </div>
        </div>
      </div>
    </section>
  );
}
