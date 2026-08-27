import Link from "next/link";
import { redirect } from "next/navigation";

import { MiniGamesArcadeSection } from "@/components/mini-games-arcade-section";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { ROLE_BACK } from "@/lib/domain/role-navigation";
import { getUserSubscription } from "@/lib/domain/subscription";
import type { UserRole } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export default async function ArcadePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    redirect("/auth?redirect=/games");
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <div className="w-full max-w-lg px-4 py-4 sticky top-0 bg-white/80 backdrop-blur z-50 border-b border-slate-100 flex items-center justify-between">
        <Link
          href={back.href}
          className="tap-scale flex items-center gap-1 text-xs font-black text-slate-600 bg-slate-100 px-3 py-2 rounded-xl hover:bg-slate-200 transition"
        >
          <span>←</span>
          <span>{back.label}</span>
        </Link>
        <h1 className="text-sm font-black text-night flex items-center gap-2">
          <span>🎮</span> Zigo Oyun Salonu
        </h1>
      </div>

      <div className="w-full max-w-lg p-4 pb-20 space-y-6 mt-2">
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-center text-white shadow-lg shadow-purple-500/20">
          <h2 className="text-xl font-black drop-shadow-md mb-2">Zeka Oyunları ile XP Kazan!</h2>
          <p className="text-sm font-semibold text-white/90">Eğlenirken öğren, skor tablosunda yüksel ve Zigo Puanı kazan.</p>
        </div>

        <MiniGamesArcadeSection 
          className="w-full"
          isPremium={isPremium}
          isStudent={isStudent}
        />
      </div>
    </div>
  );
}
