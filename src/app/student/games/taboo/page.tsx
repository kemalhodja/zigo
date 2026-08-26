import { redirect } from "next/navigation";
import { Suspense } from "react";

import { TabooGame } from "@/components/games/taboo-game";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Zigo Tabu | Zigo",
  description: "Zigo AI'a karşı eğitici tabu oyunu.",
};

export default async function TabooPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?redirect=/student/games/taboo");
  }

  return (
    <div className="mx-auto max-w-lg p-4 pb-24 md:p-8">
      <Suspense fallback={<div className="animate-pulse h-96 bg-slate-100 rounded-3xl"></div>}>
        <TabooGame userId={user.id} />
      </Suspense>
    </div>
  );
}
