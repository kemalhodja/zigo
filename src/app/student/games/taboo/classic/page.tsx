import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

import { ClassicTabooGame } from "@/components/games/classic-taboo-game";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Klasik Tabu | Zigo",
  description: "Arkadaşlarınla klasik tabu oyna.",
};

export default async function ClassicTabooPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?redirect=/student/games/taboo/classic");
  }

  return (
    <div className="mx-auto max-w-lg p-4 pb-24 md:p-8 relative">
      {/* Back button */}
      <Link 
        href="/student/games/taboo"
        className="absolute top-6 left-4 md:left-8 tap-scale w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-600 shadow-sm border border-slate-100 hover:bg-slate-50 transition"
      >
        ←
      </Link>
      
      <div className="pt-12">
        <Suspense fallback={<div className="animate-pulse h-[500px] bg-slate-100 rounded-3xl"></div>}>
          <ClassicTabooGame />
        </Suspense>
      </div>
    </div>
  );
}
