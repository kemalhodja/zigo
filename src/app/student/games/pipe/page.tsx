import Link from "next/link";
import { PipeConnect } from "@/components/games/pipe-connect";
import { GameSubscriptionPaywall } from "@/components/games/game-subscription-paywall";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getUserSubscription } from "@/lib/domain/subscription";
import { createClient } from "@/lib/supabase/server";

export default async function PipeGamePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  let isPremium = false;
  if (profile) {
    const sub = await getUserSubscription(supabase, profile.id);
    isPremium = sub.isPremium;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-3 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-sm flex items-center justify-between mb-4">
        <Link
          href="/student"
          className="tap-scale flex items-center gap-1 text-xs font-black text-slate-200 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl shadow-xs border border-slate-700 transition"
        >
          <span>←</span>
          <span>Öğrenci Paneli</span>
        </Link>
        <span className="text-xs font-bold text-cyan-400">Zigo Mantık Oyunu</span>
      </div>
      <div className="w-full">
        {isPremium ? (
          <PipeConnect userId={profile?.id} />
        ) : (
          <GameSubscriptionPaywall gameTitle="Akış Yolu" />
        )}
      </div>
    </div>
  );
}
