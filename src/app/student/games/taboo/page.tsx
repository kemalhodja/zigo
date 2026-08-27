import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Zigo Tabu | Zigo",
  description: "Zigo Tabu oyun modu seçimi.",
};

export default async function TabooModeSelectionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?redirect=/student/games/taboo");
  }

  return (
    <div className="mx-auto max-w-lg p-4 pb-24 md:p-8 flex flex-col min-h-screen justify-center items-center">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-slate-800 mb-2">🗣️ Zigo Tabu</h1>
        <p className="text-sm font-bold text-slate-500">Oynamak istediğin modu seç</p>
      </div>

      <div className="w-full space-y-4">
        {/* AI Mode */}
        <Link 
          href="/student/games/taboo/ai"
          className="tap-scale block w-full bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl p-6 shadow-xl shadow-violet-500/20 hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl shadow-inner backdrop-blur-sm">
              🤖
            </div>
            <div className="text-left text-white">
              <h2 className="text-xl font-black mb-1">Zigo AI'a Karşı</h2>
              <p className="text-xs font-medium text-violet-100 opacity-90">Tek kişilik mod. Zigo'nun anlattığı kelimeleri tahmin et!</p>
            </div>
          </div>
        </Link>

        {/* Classic Mode */}
        <Link 
          href="/student/games/taboo/classic"
          className="tap-scale block w-full bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-6 shadow-xl shadow-amber-500/20 hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl shadow-inner backdrop-blur-sm">
              👥
            </div>
            <div className="text-left text-white">
              <h2 className="text-xl font-black mb-1">Klasik Tabu</h2>
              <p className="text-xs font-medium text-amber-50 opacity-90">Arkadaşlarınla oyna. Yasaklı kelimeleri kullanmadan anlat!</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
