"use client";

import { useState } from "react";

import type { NorthStarMetricsSnapshot } from "@/lib/domain/investor-metrics";

function formatTry(val: number): string {
  return `${Math.round(val).toLocaleString("tr-TR")} ₺`;
}

export function AdminInvestorDashboard({
  metrics,
}: {
  metrics: NorthStarMetricsSnapshot;
}) {
  const [copied, setCopied] = useState(false);

  async function copyInvestorSummary() {
    const markdown = [
      `# Zigo — Yatırımcı & North Star Metrik Özeti`,
      `Tarih: ${new Date(metrics.generatedAt).toLocaleDateString("tr-TR")}`,
      ``,
      `## Gelir & SaaS`,
      `- Aktif Zigo Plus Abonesi: ${metrics.activePaidCount}`,
      `- MRR (Aylık Düzenli Gelir): ${formatTry(metrics.mrrTry)}`,
      `- ARR (Yıllık Koşu Hızı): ${formatTry(metrics.arrTry)}`,
      `- ARPU (Abone Başı Aylık Gelir): ${metrics.arpuTry.toLocaleString("tr-TR")} ₺`,
      `- Aylık Churn Oranı: %${metrics.monthlyChurnRate}`,
      ``,
      `## Büyüme & Tutundurma`,
      `- Toplam Kullanıcı: ${metrics.totalUsers} (Doğrulanmış Öğretmen: ${metrics.verifiedTeachersCount})`,
      `- DAU / WAU / MAU: ${metrics.dau} / ${metrics.wau} / ${metrics.mau} (Stickiness: %${metrics.dauMauRatio})`,
      `- D1 / D7 / D30 Retention: %${metrics.retention.d1Rate} / %${metrics.retention.d7Rate} / %${metrics.retention.d30Rate}`,
      ``,
      `## Deneme → Abonelik Dönüşümü`,
      `- Öğretmen (30 Gün Deneme): %${metrics.teacherConversion.conversionRate} (${metrics.teacherConversion.paidUsers}/${metrics.teacherConversion.totalUsers}, ${metrics.teacherConversion.inTrialUsers} aktif denemede)`,
      `- Öğrenci & Veli (7 Gün Deneme): %${metrics.learnerConversion.conversionRate} (${metrics.learnerConversion.paidUsers}/${metrics.learnerConversion.totalUsers}, ${metrics.learnerConversion.inTrialUsers} aktif denemede)`,
      ``,
      `## Birim Ekonomi & Altyapı`,
      `- Aktif Kullanıcı Başı Tahmini Aylık Maliyet (AI + Storage): ${metrics.estimatedMonthlyCostPerActiveUserTry} ₺`,
      `- Toplam Aktif Medya Depolama: ${metrics.totalStorageMb} MB (Uzun videolar YouTube/Vimeo yönlendirmeli)`,
      `- Tahmini Brüt Kâr Marjı: %${metrics.estimatedGrossMarginPercent}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(markdown);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(20);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard fallback ignored
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-6 text-white shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-300">
              💎 North Star · Data Room
            </span>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Yatırımcı &amp; Kurucu Metrik Panosu
            </h2>
            <p className="mt-1 text-xs font-semibold text-white/75">
              Canlı DAU/MAU, kohort tutundurma, 30g/7g deneme dönüşümü, MRR ve birim ekonomi özeti.
            </p>
          </div>

          <button
            type="button"
            onClick={copyInvestorSummary}
            className="tap-scale inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow-lg transition hover:brightness-105"
          >
            <span>{copied ? "✅ Data Room Özeti Kopyalandı" : "📋 Yatırımcı Özeti Kopyala"}</span>
          </button>
        </div>

        {/* 5 Core North Star KPIs */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/60">MRR</p>
            <p className="mt-1 text-xl font-black text-emerald-300">{formatTry(metrics.mrrTry)}</p>
            <p className="mt-0.5 text-[11px] font-bold text-white/70">ARR: {formatTry(metrics.arrTry)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/60">DAU / MAU</p>
            <p className="mt-1 text-xl font-black text-sky-300">
              {metrics.dau} / {metrics.mau}
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-white/70">Bağlılık: %{metrics.dauMauRatio}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/60">Trial → Paid</p>
            <p className="mt-1 text-xl font-black text-amber-300">%{metrics.overallConversionRate}</p>
            <p className="mt-0.5 text-[11px] font-bold text-white/70">{metrics.activePaidCount} aktif abone</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/60">D7 / D30</p>
            <p className="mt-1 text-xl font-black text-fuchsia-300">
              %{metrics.retention.d7Rate} / %{metrics.retention.d30Rate}
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-white/70">D1: %{metrics.retention.d1Rate}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 col-span-2 sm:col-span-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/60">Brüt Marj</p>
            <p className="mt-1 text-xl font-black text-emerald-300">%{metrics.estimatedGrossMarginPercent}</p>
            <p className="mt-0.5 text-[11px] font-bold text-white/70">ARPU: {metrics.arpuTry} ₺</p>
          </div>
        </div>
      </section>

      {/* Conversion & Retention Split */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Trial -> Paid Breakdown */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">
            Deneme → Zigo Plus Dönüşüm Hunisi
          </h3>
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-black text-night">
                <span>🎓 Öğretmenler (30 Gün Deneme)</span>
                <span className="text-violet-700">%{metrics.teacherConversion.conversionRate}</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                  style={{ width: `${Math.min(100, metrics.teacherConversion.conversionRate)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                {metrics.teacherConversion.paidUsers} abone · {metrics.teacherConversion.inTrialUsers} aktif 30g denemede · Toplam {metrics.teacherConversion.totalUsers}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-black text-night">
                <span>🎒 Öğrenci &amp; Veli (7 Gün Deneme)</span>
                <span className="text-emerald-700">%{metrics.learnerConversion.conversionRate}</span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  style={{ width: `${Math.min(100, metrics.learnerConversion.conversionRate)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                {metrics.learnerConversion.paidUsers} abone · {metrics.learnerConversion.inTrialUsers} aktif 7g denemede · Toplam {metrics.learnerConversion.totalUsers}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-center">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-lg font-black text-night">{metrics.verifiedTeachersCount}</p>
                <p className="text-[10px] font-black uppercase text-slate-500">Doğrulanmış Öğretmen</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-lg font-black text-night">{metrics.weeklyPostsCount}</p>
                <p className="text-[10px] font-black uppercase text-slate-500">Haftalık Gönderi</p>
              </div>
            </div>
          </div>
        </section>

        {/* Unit Economics & Churn */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">
            Birim Ekonomi (ARPU vs Maliyet) &amp; Churn
          </h3>
          <div className="mt-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between rounded-xl bg-emerald-50/70 px-3.5 py-2.5">
              <span className="font-bold text-slate-700">Abone Başı Aylık Gelir (ARPU)</span>
              <span className="font-black text-emerald-700">{metrics.arpuTry.toLocaleString("tr-TR")} ₺</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5">
              <span className="font-bold text-slate-700">Aktif Kullanıcı Başı Maliyet (AI + Storage)</span>
              <span className="font-black text-slate-900">
                {metrics.estimatedMonthlyCostPerActiveUserTry.toLocaleString("tr-TR")} ₺
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5">
              <span className="font-bold text-slate-700">Toplam Tahmini Aylık Değişken Maliyet</span>
              <span className="font-black text-slate-900">{formatTry(metrics.estimatedTotalMonthlyInfraTry)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5">
              <span className="font-bold text-slate-700">Aktif Medya Depolama (30sn Video + Foto)</span>
              <span className="font-black text-indigo-700">{metrics.totalStorageMb.toLocaleString("tr-TR")} MB</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-rose-50/70 px-3.5 py-2.5">
              <span className="font-bold text-slate-700">Son 30 Gün İptal / Süresi Biten (Churn)</span>
              <span className="font-black text-rose-700">
                {metrics.churned30d} (%{metrics.monthlyChurnRate})
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
