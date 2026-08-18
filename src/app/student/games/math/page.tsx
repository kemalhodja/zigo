import { redirect } from "next/navigation";

import { MathMaster } from "@/components/games/math-master";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function MathGamePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4">
      <div className="flex-1 w-full max-w-sm mx-auto flex flex-col justify-center">
        <MathMaster userId={profile.id} />
      </div>
    </div>
  );
}
