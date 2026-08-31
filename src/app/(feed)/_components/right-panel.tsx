import { ArrowRightIcon, CalendarIcon, TrophyIcon } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export async function LeaderboardWidget() {
  const supabase = await createClient();
  const { data: topUsers } = await supabase
    .from("users")
    .select("id, full_name, total_points")
    .order("total_points", { ascending: false })
    .limit(3);

  // Fallback to static if no data yet (for UI consistency in empty db)
  const ranks = topUsers && topUsers.length > 0
    ? topUsers.map((u, i) => ({
        rank: i + 1,
        name: u.full_name || "Gizli Kullanıcı",
        xp: u.total_points || 0,
        color: i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : "text-orange-400",
        bg: i === 0 ? "bg-amber-50" : i === 1 ? "bg-slate-50" : "bg-orange-50",
      }))
    : [
        { rank: 1, name: "Sıralama Hesaplanıyor...", xp: 0, color: "text-slate-400", bg: "bg-slate-50" },
      ];

  return (
    <div className="mb-4 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
      <div className="mb-4 flex items-center gap-2">
        <TrophyIcon className="h-5 w-5 text-amber-500" />
        <h3 className="text-sm font-black text-slate-800">Liderlik Tablosu</h3>
      </div>
      <div className="space-y-2">
        {ranks.map((r, idx) => (
          <div key={idx} className="group flex items-center justify-between rounded-xl p-2 transition-colors hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${r.color} ${r.bg}`}>
                {r.rank}
              </span>
              <span className="text-sm font-bold text-slate-700">{r.name}</span>
            </div>
            <span className="text-xs font-black text-slate-400 group-hover:text-amber-600 transition-colors">
              {r.xp} xp
            </span>
          </div>
        ))}
      </div>
      <button className="group mt-4 flex w-full items-center justify-center gap-1 rounded-xl bg-slate-50 py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
        Tümünü Gör
        <ArrowRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}

export function UpcomingLessonWidget() {
  const today = new Date();
  today.setHours(today.getHours() + 2); // Set a dynamic upcoming time
  const timeStr = today.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
      <div className="mb-4 flex items-center gap-2">
        <CalendarIcon className="h-5 w-5 text-blue-500" />
        <h3 className="text-sm font-black text-slate-800">Yaklaşan Dersler</h3>
      </div>
      <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 shadow-md transition-transform hover:-translate-y-0.5">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md">
              Matematik
            </span>
            <p className="mt-2 text-sm font-bold leading-tight text-white">
              Fonksiyonlar ve Grafikler
            </p>
          </div>
          <div className="flex flex-col items-end rounded-lg bg-white/20 p-2 backdrop-blur-md">
            <span className="text-[10px] font-black uppercase text-blue-100">Bugün</span>
            <span className="text-sm font-black text-white">{timeStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RightPanel() {
  return (
    <div className="flex flex-col gap-4">
      <LeaderboardWidget />
      <UpcomingLessonWidget />
      
      {/* Footer Links */}
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2 px-2 text-[11px] font-medium text-slate-400">
        <a href="/about" className="hover:text-slate-600 hover:underline">Hakkımızda</a>
        <a href="/legal" className="hover:text-slate-600 hover:underline">Gizlilik ve Şartlar</a>
        <a href="/help" className="hover:text-slate-600 hover:underline">Yardım Merkezi</a>
        <span className="w-full text-center">© 2026 Zigo</span>
      </div>
    </div>
  );
}
