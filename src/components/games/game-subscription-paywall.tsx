import Link from "next/link";

type GameSubscriptionPaywallProps = {
  gameTitle: string;
  backHref?: string;
  backLabel?: string;
};

export function GameSubscriptionPaywall({
  gameTitle,
  backHref = "/student",
  backLabel = "Panele Dön",
}: GameSubscriptionPaywallProps) {
  return (
    <div className="w-full max-w-sm mx-auto p-6 bg-white rounded-3xl border border-slate-200 shadow-xl text-center animate-in zoom-in-95 duration-200">
      {/* Icon */}
      <div className="mx-auto size-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center text-4xl shadow-xl shadow-amber-500/30 mb-5">
        🔒
      </div>

      <span className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[0.68rem] font-black uppercase tracking-wider mb-3 border border-amber-200">
        Zigo Plus Ayrıcalığı
      </span>

      <h2 className="text-xl font-black text-slate-900 mb-2">{gameTitle} Kilitli</h2>

      <p className="text-xs text-slate-600 font-semibold leading-relaxed mb-3">
        Kayıttan sonraki <strong className="text-slate-900">30 günlük ücretsiz deneme süreniz</strong> dolmuştur.
      </p>

      {/* Feature highlights */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { icon: "⚡", label: "Sınırsız Oyun" },
          { icon: "🏆", label: "XP Puanları" },
          { icon: "🚫", label: "Reklamsız" },
        ].map(({ icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 bg-amber-50 rounded-xl p-2.5 border border-amber-100"
          >
            <span className="text-xl">{icon}</span>
            <span className="text-[0.6rem] font-black text-amber-900 text-center leading-tight">{label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2.5">
        <Link
          href="/profile/upgrade"
          className="tap-scale block w-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black py-3.5 rounded-xl shadow-lg shadow-amber-500/25 hover:brightness-105 transition text-sm"
        >
          Zigo Plus'a Abone Ol ✨
        </Link>

        <Link
          href={backHref}
          className="tap-scale block w-full bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl hover:bg-slate-200 transition text-xs"
        >
          ← {backLabel}
        </Link>
      </div>
    </div>
  );
}
