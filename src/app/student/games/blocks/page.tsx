import { BlockPuzzle } from "@/components/games/block-puzzle";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function BlockGamePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full">
        <BlockPuzzle userId={profile?.id} />
      </div>
    </div>
  );
}
