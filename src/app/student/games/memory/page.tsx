import { ZihinAvcisi } from "@/components/games/zihin-avcisi";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function MemoryGamePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full">
        <ZihinAvcisi userId={profile?.id} />
      </div>
    </div>
  );
}
