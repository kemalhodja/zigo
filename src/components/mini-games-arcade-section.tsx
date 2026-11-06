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
    ? "Oyun salonu Zigo Plus abonelerine özeldir. Hemen abone olun."
    : isStudent
      ? "Günde maksimum 2 saat · 08:00–22:00 · Zigo Puanı (XP) kazan!"
      : "Zihnini dinlendir, odaklan ve Zigo Puanı (XP) kazan!";

  const getPlayLink = (targetHref: string) => (isPremium ? targetHref : "/pricing");
  const playButtonLabel = isPremium ? "Oyna" : "🔒 Abone Ol";
  const playButtonClass = (textColor: string) =>
    `tap-scale shrink-0 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs transition-colors ${
      isPremium
        ? `bg-white ${textColor} hover:bg-slate-50`
        : "bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200"
    }`;

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
          {isPremium ? "8 Mini Oyun" : "Kilitli 🔒"}
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
              href={getPlayLink("/games/memory")}
              className={playButtonClass("text-indigo-700")}
            >
              {playButtonLabel}
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
              href={getPlayLink("/games/blocks")}
              className={playButtonClass("text-emerald-700")}
            >
              {playButtonLabel}
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
              href={getPlayLink("/games/pipe")}
              className={playButtonClass("text-cyan-700")}
            >
              {playButtonLabel}
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
              href={getPlayLink("/games/math")}
              className={playButtonClass("text-rose-700")}
            >
              {playButtonLabel}
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
              href={getPlayLink("/games/word")}
              className={playButtonClass("text-teal-700")}
            >
              {playButtonLabel}
            </Link>
          </div>
          <div className="absolute top-0 right-0 -mr-4 -mt-4 text-white/10 text-6xl transform rotate-12 transition-transform group-hover:scale-110 pointer-events-none">
            🔤
          </div>
        </div>


        {/* Oyun 6: Zigo Tabu (Yasak Kelime) */}
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
              href={getPlayLink("/games/taboo")}
              className={playButtonClass("text-fuchsia-700")}
            >
              {playButtonLabel}
            </Link>
          </div>
          <div className="absolute top-0 right-0 -mr-4 -mt-4 text-white/10 text-6xl transform rotate-12 transition-transform group-hover:scale-110 pointer-events-none">
            🗣️
          </div>
        </div>

        {/* Oyun 7: 2048 (Sayısal Strateji) */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-3.5 py-3.5 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>🔢</span> 2048
              </h3>
              <p className="text-amber-100 text-[0.62rem] font-bold mt-0.5">Sayısal Strateji</p>
              <div className="mt-2 flex items-center gap-1 text-[0.55rem] font-black text-white/80 bg-black/20 w-fit px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                <span aria-hidden="true">🏆</span>
                Sayıları birleştir · 2048&apos;e ulaş
              </div>
            </div>
            <Link
              href={getPlayLink("/games/2048")}
              className={playButtonClass("text-orange-700")}
            >
              {playButtonLabel}
            </Link>
          </div>
          <div className="absolute top-0 right-0 -mr-4 -mt-4 text-white/10 text-6xl transform rotate-12 transition-transform group-hover:scale-110 pointer-events-none">
            🔢
          </div>
        </div>

        {/* Oyun 8: Sudoku (Mantık & Zeka) */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 px-3.5 py-3.5 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>🧩</span> Sudoku
              </h3>
              <p className="text-indigo-100 text-[0.62rem] font-bold mt-0.5">Mantıksal Akıl Yürütme</p>
              <div className="mt-2 flex items-center gap-1 text-[0.55rem] font-black text-white/80 bg-black/20 w-fit px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                <span aria-hidden="true">🧠</span>
                Kolay / Orta / Zor · İpucu &amp; Not
              </div>
            </div>
            <Link
              href={getPlayLink("/games/sudoku")}
              className={playButtonClass("text-indigo-700")}
            >
              {playButtonLabel}
            </Link>
          </div>
          <div className="absolute top-0 right-0 -mr-4 -mt-4 text-white/10 text-6xl transform -rotate-12 transition-transform group-hover:scale-110 pointer-events-none">
            🧩
          </div>
        </div>
      </div>
    </section>
  );
}
