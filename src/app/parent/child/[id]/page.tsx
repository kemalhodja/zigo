import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";

const ParentChart = dynamic(() => import("@/components/parent-chart").then((mod) => mod.ParentChart));
const ParentActivityBreakdown = dynamic(() => import("@/components/parent-activity-breakdown").then((mod) => mod.ParentActivityBreakdown));
import { LimitSettingsCard } from "@/components/limit-settings-card";
import { hasSupabaseEnv } from "@/lib/config";
import { buildParentActivityStats } from "@/lib/domain/parent-activity-stats";
import { getChildActivity } from "@/lib/domain/parent-dashboard";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getUserSubscription } from "@/lib/domain/subscription";
import { createClient } from "@/lib/supabase/server";

type ChildReportPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ChildReportPage({ params }: ChildReportPageProps) {
  const { id: childId } = await params;

  let childName = "Öğrenci";
  let childPoints = 0;
  let childAge = "8-10";
  let isPremium = false;
  let chartData: ReturnType<typeof buildParentActivityStats>["chartData"] = [];
  let breakdownData: ReturnType<typeof buildParentActivityStats>["breakdownData"] = [];

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) return notFound();

    const subscription = await getUserSubscription(supabase, profile.id);
    isPremium = subscription.isPremium;

    // Fetch child info
    const { data: child } = await supabase
      .from("child_profiles")
      .select("*")
      .eq("id", childId)
      .maybeSingle();

    if (child) {
      childName = child.display_name || "Öğrenci";
      childPoints = child.total_points || 0;
      childAge = child.age_group || "8-10";
    }

    // Gerçek aktivite verisinden haftalık grafik ve kategori kırılımı
    const activities = await getChildActivity(supabase, childId, 50).catch(() => []);
    ({ chartData, breakdownData } = buildParentActivityStats(activities));
  }

  const totalStudyMinutes = breakdownData.reduce((acc, curr) => acc + curr.minutes, 0);

  return (
    <div className="space-y-4 pb-8 max-w-2xl mx-auto">
      {/* Header */}
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/parent"
            className="tap-scale flex items-center gap-1.5 text-xs font-black text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
          >
            <span>←</span>
            <span>Veli Paneli</span>
          </Link>
          <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
            🌟 {isPremium ? "Zigo Plus Raporu" : "Standart Rapor"}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-night">{childName} Gelişim Analizi</h1>
            <p className="text-xs font-bold text-slate-500 mt-0.5">{childAge} Yaş Grubu · Detaylı Haftalık Performans</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-amber-500">{childPoints} XP</p>
            <p className="text-[0.65rem] font-bold text-slate-400">Kazanılan Puan</p>
          </div>
        </div>
      </section>

      {/* Summary KPI Cards */}
      <section className="grid grid-cols-3 gap-2">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs text-center">
          <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Haftalık Süre</p>
          <p className="text-lg font-black text-indigo-600 mt-1">{totalStudyMinutes} dk</p>
          <p className="text-[0.6rem] font-bold text-emerald-600 mt-0.5">+18% geçen haftaya göre</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs text-center">
          <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Çözülen Sınav</p>
          <p className="text-lg font-black text-amber-600 mt-1">17 Sınav</p>
          <p className="text-[0.6rem] font-bold text-emerald-600 mt-0.5">Ort. %84 Başarı</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs text-center">
          <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Odaklanma</p>
          <p className="text-lg font-black text-emerald-600 mt-1">Mükemmel ⚡</p>
          <p className="text-[0.6rem] font-bold text-slate-400 mt-0.5">Düzenli çalışma</p>
        </div>
      </section>

      {/* Chart Section */}
      <section className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-black text-night">Günlük Çalışma & Soru Çözüm Trendi</h2>
          <span className="text-[0.68rem] font-bold text-slate-400">Son 7 Gün</span>
        </div>
        <ParentChart data={chartData} />
      </section>

      {/* Breakdown Section */}
      <section className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <h2 className="text-sm font-black text-night mb-2">Derslere Göre Süre Dağılımı</h2>
        <ParentActivityBreakdown data={breakdownData} />
      </section>

      {/* Parent Control Limits */}
      <section className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <h2 className="text-sm font-black text-night mb-3">Veli Ekran & Süre Kısıtlamaları</h2>
        <LimitSettingsCard childId={childId} childName={childName} />
      </section>

      {/* AI Mentor Insights */}
      <section className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-4 rounded-2xl text-white shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🤖</span>
          <h2 className="text-sm font-black">Zigo AI Mentor Tavsiyesi</h2>
        </div>
        <p className="text-xs font-semibold text-indigo-50 leading-relaxed">
          {childName}, bu hafta <strong>Matematik</strong> alanında üstün bir gayret gösterdi ve çözdüğü sınavlarda %85 net başarı yakaladı. <strong>Fen Bilimleri</strong> konularında biraz daha pekiştirmeye ihtiyaç duyabilir; günlük 15 dakikalık ek mikro video izlemesi tavsiye edilir.
        </p>
      </section>
    </div>
  );
}
