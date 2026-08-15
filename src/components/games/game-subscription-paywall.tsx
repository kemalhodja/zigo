import Link from "next/link";

type GameSubscriptionPaywallProps = {
  gameTitle: string;
};

export function GameSubscriptionPaywall({ gameTitle }: GameSubscriptionPaywallProps) {
  return (
    <div className="w-full max-w-sm mx-auto p-6 bg-white rounded-3xl border border-slate-200 shadow-xl text-center animate-in zoom-in-95 duration-200 text-night">
      <div className="mx-auto size-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30 mb-4">
        🔒
      </div>

      <span className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[0.68rem] font-black uppercase tracking-wider mb-2 border border-amber-200">
        Zigo Plus Ayrıcalığı
      </span>

      <h2 className="text-xl font-black text-night mb-2">{gameTitle} Kilitli</h2>

      <p className="text-xs text-slate-600 font-bold leading-relaxed mb-6">
        Kayıttan sonraki <strong>30 günlük ücretsiz deneme süreniz</strong> dolmuştur. Zeka oyunları salonuna, reklamsız içeriklere ve tüm Zigo Plus ayrıcalıklarına erişmek için hemen abone olun!
      </p>

      <div className="space-y-2.5">
        <Link
          href="/profile#zigo-plus"
          className="tap-scale block w-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black py-3.5 rounded-xl shadow-lg shadow-amber-500/25 hover:brightness-105 transition text-xs"
        >
          Zigo Plus'a Abone Ol ✨
        </Link>

        <Link
          href="/student"
          className="tap-scale block w-full bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl hover:bg-slate-200 transition text-xs"
        >
          Öğrenci Paneline Dön
        </Link>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-4 text-[0.68rem] font-bold text-slate-400">
        <span>⚡ Sınırsız Oyun</span>
        <span>•</span>
        <span>🏆 XP Puanları</span>
        <span>•</span>
        <span>🚫 Reklamsız</span>
      </div>
    </div>
  );
}
