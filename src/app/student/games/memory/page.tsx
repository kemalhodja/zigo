import Link from "next/link";
import { redirect } from "next/navigation";
import { ROLE_BACK } from "@/lib/domain/role-navigation";
import type { UserRole } from "@/lib/supabase/database.types";
import { ZihinAvcisi } from "@/components/games/zihin-avcisi";
import { GameSubscriptionPaywall } from "@/components/games/game-subscription-paywall";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getUserSubscription } from "@/lib/domain/subscription";
import { createClient } from "@/lib/supabase/server";



export default async function MemoryGamePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    redirect("/auth?redirect=/student/games/memory");
  }

  let isPremium = false;
  if (profile) {
    const sub = await getUserSubscription(supabase, profile.id);
    isPremium = sub.isPremium;
  }

  const role = (profile?.role as UserRole) ?? "student";
  const back = ROLE_BACK[role] ?? ROLE_BACK.student;

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-sm flex items-center justify-between mb-4">
        <Link
          href={back.href}
          className="tap-scale flex items-center gap-1 text-xs font-black text-slate-600 bg-white px-3 py-2 rounded-xl shadow-xs border border-slate-200 hover:bg-slate-50 transition"
        >
          <span>←</span>
          <span>{back.label}</span>
        </Link>
        <span className="text-xs font-bold text-slate-400">Zigo Mini Oyun</span>
      </div>
      <div className="w-full">
        {isPremium ? (
          <ZihinAvcisi userId={profile?.id} />
        ) : (
          <GameSubscriptionPaywall
            gameTitle="Zihin Avcısı"
            backHref={back.href}
            backLabel={back.label}
          />
        )}
      </div>
    </div>
  );
}

