import { redirect } from "next/navigation";
import { Suspense } from "react";

import { GameSessionTracker } from "@/components/games/game-session-tracker";
import { GameSubscriptionPaywall } from "@/components/games/game-subscription-paywall";
import { GameTimeLimitWall } from "@/components/games/game-time-limit-wall";
import { TabooGame } from "@/components/games/taboo-game";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { ROLE_BACK } from "@/lib/domain/role-navigation";
import { getUserSubscription } from "@/lib/domain/subscription";
import type { UserRole } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Zigo Tabu AI | Zigo",
  description: "Zigo AI'a karşı eğitici tabu oyunu.",
};

export default async function AITabooPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    redirect("/auth?redirect=/student/games/taboo/ai");
  }

  const sub = await getUserSubscription(supabase, profile.id);
  const isPremium = sub.isPremium;

  const role = (profile.role as UserRole) ?? "student";
  const back = ROLE_BACK[role] ?? ROLE_BACK.student;
  const isStudent = role === "student";

  return (
    <div className="mx-auto max-w-lg p-4 pb-24 md:p-8">
      <GameTimeLimitWall backHref="/student/games/taboo" backLabel="Tabu">
        {isPremium ? (
          <GameSessionTracker enabled={isStudent} userId={profile.id}>
            <Suspense fallback={<div className="animate-pulse h-96 bg-slate-100 rounded-3xl" />}>
              <TabooGame userId={profile.id} />
            </Suspense>
          </GameSessionTracker>
        ) : (
          <GameSubscriptionPaywall
            gameTitle="Zigo Tabu AI"
            backHref={back.href}
            backLabel={back.label}
            isStudent={isStudent}
          />
        )}
      </GameTimeLimitWall>
    </div>
  );
}
