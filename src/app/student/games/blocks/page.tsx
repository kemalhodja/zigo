import Link from "next/link";
import { redirect } from "next/navigation";

import { BlockPuzzle } from "@/components/games/block-puzzle";
import { GameSessionTracker } from "@/components/games/game-session-tracker";
import { GameSubscriptionPaywall } from "@/components/games/game-subscription-paywall";
import { GameTimeLimitWall } from "@/components/games/game-time-limit-wall";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { ROLE_BACK } from "@/lib/domain/role-navigation";
import { getUserSubscription } from "@/lib/domain/subscription";
import type { UserRole } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";



export default async function BlockGamePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    redirect("/auth?redirect=/student/games/blocks");
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
    <div className="min-h-screen bg-slate-950 p-3 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-sm flex items-center justify-between mb-4">
        <Link
          href={back.href}
          className="tap-scale flex items-center gap-1 text-xs font-black text-slate-300 bg-white/10 px-3 py-2 rounded-xl shadow-xs border border-white/10 hover:bg-white/20 transition backdrop-blur-sm"
        >
          <span>←</span>
          <span>{back.label}</span>
        </Link>
        <span className="text-xs font-bold text-slate-500">Zigo Mini Oyun</span>
      </div>
      <div className="w-full">
        <GameTimeLimitWall backHref={back.href} backLabel={back.label}>
          {isPremium ? (
            <GameSessionTracker enabled={isStudent} userId={profile?.id}>
              <BlockPuzzle userId={profile?.id} />
            </GameSessionTracker>
          ) : (
            <GameSubscriptionPaywall
              gameTitle="Blok Zeka"
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

