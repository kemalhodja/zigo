import Link from "next/link";
import { redirect } from "next/navigation";

import { GameSubscriptionPaywall } from "@/components/games/game-subscription-paywall";
import { GameTimeLimitWall } from "@/components/games/game-time-limit-wall";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { ROLE_BACK } from "@/lib/domain/role-navigation";
import { getUserSubscription } from "@/lib/domain/subscription";
import type { UserRole } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Zigo Tabu | Zigo",
  description: "Zigo Tabu oyun modu seçimi.",
};

export default async function TabooModeSelectionPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    redirect("/auth?redirect=/games/taboo");
  }

  const sub = await getUserSubscription(supabase, profile.id);
  const isPremium = sub.isPremium;

  const role = (profile.role as UserRole) ?? "student";
  const back = ROLE_BACK[role] ?? ROLE_BACK.student;
  const isStudent = role === "student";

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={back.href}
          className="tap-scale flex items-center gap-1 text-xs font-black text-slate-600 bg-white px-3 py-2 rounded-xl shadow-xs border border-slate-200 hover:bg-slate-50 transition"
        >
          <span>←</span>
          <span>{back.label}</span>
        </Link>
        <span className="text-xs font-bold text-fuchsia-500">Zigo Tabu</span>
      </div>

      <GameTimeLimitWall backHref={back.href} backLabel={back.label}>
        {isPremium ? (
          <div className="mx-auto max-w-lg flex flex-col justify-center items-center flex-1">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-black text-slate-800 mb-2">🗣️ Zigo Tabu</h1>
              <p className="text-sm font-bold text-slate-500">Oynamak istediğin modu seç</p>
            </div>

            <div className="w-full space-y-4">
              {/* AI Mode */}
              <Link
                href="/games/taboo/ai"
                className="tap-scale block w-full bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl p-6 shadow-xl shadow-violet-500/20 hover:scale-[1.02] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl shadow-inner backdrop-blur-sm">
                    🤖
                  </div>
                  <div className="text-left text-white">
                    <h2 className="text-xl font-black mb-1">Zigo AI&apos;a Karşı</h2>
                    <p className="text-xs font-medium text-violet-100 opacity-90">
                      Tek kişilik mod. Zigo&apos;nun anlattığı kelimeleri tahmin et!
                    </p>
                  </div>
                </div>
              </Link>

              {/* Classic Mode */}
              <Link
                href="/games/taboo/classic"
                className="tap-scale block w-full bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-6 shadow-xl shadow-amber-500/20 hover:scale-[1.02] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl shadow-inner backdrop-blur-sm">
                    👥
                  </div>
                  <div className="text-left text-white">
                    <h2 className="text-xl font-black mb-1">Klasik Tabu</h2>
                    <p className="text-xs font-medium text-amber-50 opacity-90">
                      Arkadaşlarınla oyna. Yasaklı kelimeleri kullanmadan anlat!
                    </p>
                  </div>
                </div>
              </Link>
            </div>

            {isStudent && (
              <p className="mt-8 text-center text-[0.7rem] font-bold text-slate-400">
                Günde 1 saat · 08:00–22:00 · Zigo Puanı (XP) kazan!
              </p>
            )}
          </div>
        ) : (
          <GameSubscriptionPaywall
            gameTitle="Zigo Tabu"
            backHref={back.href}
            backLabel={back.label}
            isStudent={isStudent}
          />
        )}
      </GameTimeLimitWall>
    </div>
  );
}
