import { redirect } from "next/navigation";

import { WordHunt } from "@/components/games/word-hunt";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function WordHuntPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-4">
      <div className="flex-1 w-full max-w-sm mx-auto flex flex-col justify-center">
        <WordHunt userId={profile.id} />
      </div>
    </div>
  );
}
