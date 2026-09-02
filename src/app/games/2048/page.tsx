import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Game2048 } from "@/components/games/game-2048";
import { GameSessionTracker } from "@/components/games/game-session-tracker";
import { GameSubscriptionPaywall } from "@/components/games/game-subscription-paywall";
import { GameTimeLimitWall } from "@/components/games/game-time-limit-wall";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { ROLE_BACK } from "@/lib/domain/role-navigation";
import { getUserSubscription } from "@/lib/domain/subscription";
import type { UserRole } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "2048 · Zigo Oyun",
  description: "Sayıları birleştirerek 2048 taşına ulaş, stratejini konuştur.",
};

export default async function Game2048Page() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    redirect("/auth?redirect=/games/2048");
  }

  let isPremium = false;
  if (profile) {
    const sub = await getUserSubscription(supabase, profile.id);
    isPremium = sub.isPremium;
  }

  const role = (profile?.role as UserRole) ?? "student";
  const back = ROLE_BACK[role] ?? ROLE_BACK.student;
  const isStudent = role === "student";

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-sm flex items-center justify-between mb-4">
        <Link
          href={back.href}
          className="tap-scale flex items-center gap-1 text-xs font-black text-slate-600 bg-white px-3 py-2 rounded-xl shadow-xs border border-slate-200 hover:bg-slate-50 transition"
        >
          <span>←</span>
          <span>{back.label}</span>
        </Link>
        <span className="text-xs font-bold text-amber-600">Zigo Sayısal Oyunu</span>
      </div>
      <div className="w-full">
        <GameTimeLimitWall backHref={back.href} backLabel={back.label}>
          {isPremium ? (
            <GameSessionTracker enabled={isStudent} userId={profile?.id}>
              <Game2048 userId={profile?.id} />
            </GameSessionTracker>
          ) : (
            <GameSubscriptionPaywall
              gameTitle="2048"
              backHref={back.href}
              backLabel={back.label}
              isStudent={isStudent}
            />
          )}
        </GameTimeLimitWall>
      </div>
    </div>
  );
}
