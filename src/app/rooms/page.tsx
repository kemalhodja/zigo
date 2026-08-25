import { BackButton } from "@/components/back-button";
import { LiveRoomsClient, type RoomViewer } from "@/components/rooms/live-rooms-client";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Çalışma Odaları | Zigo",
};

export default async function StudyRoomsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  const viewer: RoomViewer | null = profile
    ? {
        id: profile.id,
        name: profile.full_name || "Öğrenci",
        avatarUrl: null,
      }
    : null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-md">
        <BackButton className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100" fallbackHref="/learn" />
        <h1 className="text-lg font-bold text-night">Çalışma Odaları</h1>
        <div className="w-10" />
      </header>

      <main className="p-4">
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-md">
          <h2 className="mb-2 text-xl font-black">Birlikte Odaklanın! 🚀</h2>
          <p className="text-sm font-medium text-indigo-100">
            Herkesin sayacı aynı anda işlediği canlı odalara katılın. 25 dakika odak, 5 dakika mola
            — bloklar saat :00 ve :30&apos;da otomatik başlar.
          </p>
        </div>

        <LiveRoomsClient viewer={viewer} />
      </main>
    </div>
  );
}
