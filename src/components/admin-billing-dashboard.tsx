"use client";

import Link from "next/link";
import { useState } from "react";

import type { ActiveSubscription, ChurnedUser, RevenueKpi } from "@/lib/domain/admin-billing";

type AdminBillingDashboardProps = {
  kpi: RevenueKpi;
  activeSubscriptions: ActiveSubscription[];
  recentChurns: ChurnedUser[];
};

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  stripe: { label: "Stripe", color: "bg-violet-50 text-violet-700" },
  bank_transfer: { label: "Havale/EFT", color: "bg-cyan-50 text-cyan-700" },
  admin_grant: { label: "Admin", color: "bg-amber-50 text-amber-700" },
  google_play: { label: "Google Play", color: "bg-emerald-50 text-emerald-700" },
  unknown: { label: "Bilinmiyor", color: "bg-slate-100 text-slate-500" },
};

const ROLE_LABELS: Record<string, string> = {
  student: "Öğrenci",
  teacher: "Öğretmen",
  parent: "Veli",
  education_institution: "Kurum",
  education_platform: "Platform",
  publisher: "Yayınevi",
};

function KpiCard({
  label,
  value,
  sub,
  alert,
}: {
  label: string;
  value: string | number;
  sub?: string;
  alert?: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 ${alert ? "bg-amber-50" : "bg-slate-50"}`}>
      <p className={`text-xl font-black ${alert ? "text-amber-700" : "text-night"}`}>{value}</p>
      <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      {sub && <p className="mt-0.5 text-[0.65rem] font-bold text-slate-400">{sub}</p>}
    </div>
  );
}

export function AdminBillingDashboard({
  kpi,
  activeSubscriptions,
  recentChurns,
}: AdminBillingDashboardProps) {
  const [tab, setTab] = useState<"active" | "churn">("active");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredSubs = activeSubscriptions.filter((sub) => {
    if (roleFilter !== "all" && sub.userRole !== roleFilter) return false;
    if (sourceFilter !== "all" && sub.source !== sourceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!sub.userFullName.toLowerCase().includes(q) && !sub.userEmail.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const churnRate7 = kpi.activeSubscriberCount > 0
    ? ((kpi.churnedLast7Days / kpi.activeSubscriberCount) * 100).toFixed(1)
    : "0.0";

  return (
    <section className="-mx-4 bg-white">
      {/* Header */}
      <div className="border-b border-slate-100 px-4 py-4">
        <h3 className="text-lg font-black text-night">💳 Ödeme & Abonelik Yönetimi</h3>
        <p className="mt-1 text-xs font-bold text-slate-500">
          MRR, abonelik listesi, churn analizi ve yakında dolacaklar
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 px-4 py-4 sm:grid-cols-4">
        <KpiCard
          label="Aktif Aboneler"
          value={kpi.activeSubscriberCount.toLocaleString("tr-TR")}
        />
        <KpiCard
          label="Deneme Kullananlar"
          value={kpi.trialCount.toLocaleString("tr-TR")}
          sub="7 günlük trial"
        />
        <KpiCard
          label="MRR (₺)"
          value={`₺${kpi.mrr.toLocaleString("tr-TR")}`}
          sub={`ARR: ₺${kpi.arr.toLocaleString("tr-TR")}`}
        />
        <KpiCard
          label="Churn (7 gün)"
          value={`${kpi.churnedLast7Days} (${churnRate7}%)`}
          alert={kpi.churnedLast7Days > 10}
        />
        <KpiCard
          label="7 Günde Dolacaklar"
          value={kpi.expiringIn7Days}
          alert={kpi.expiringIn7Days > 5}
          sub="Yenileme riski"
        />
        <KpiCard
          label="30 Günde Dolacaklar"
          value={kpi.expiringIn30Days}
        />
        <KpiCard
          label="Churn (30 gün)"
          value={kpi.churnedLast30Days}
          alert={kpi.churnedLast30Days > 50}
        />
        <div className="rounded-xl bg-gradient-to-br from-crystal/10 to-indigo-50 p-4">
          <p className="text-xl font-black text-crystal">₺{(kpi.arr / 12).toLocaleString("tr-TR")}</p>
          <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">Aylık Ortalama</p>
          <p className="mt-0.5 text-[0.65rem] font-bold text-crystal/70">ARR / 12</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 px-4 pb-4">
        {(["active", "churn"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${
              tab === t
                ? "bg-crystal text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {t === "active"
              ? `✅ Aktif Abonelikler (${filteredSubs.length})`
              : `❌ Churn Listesi (${recentChurns.length})`}
          </button>
        ))}
      </div>

      {/* Active Subscriptions */}
      {tab === "active" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 px-4 py-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İsim veya e-posta ara..."
              className="flex-1 min-w-[160px] rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold focus:border-crystal focus:outline-none"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold focus:border-crystal focus:outline-none"
            >
              <option value="all">Tüm Roller</option>
              {Object.entries(ROLE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold focus:border-crystal focus:outline-none"
            >
              <option value="all">Tüm Kaynaklar</option>
              {Object.entries(SOURCE_LABELS).map(([v, s]) => (
                <option key={v} value={v}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredSubs.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-black text-night">Abonelik bulunamadı</p>
              </div>
            ) : (
              filteredSubs.map((sub) => {
                const sourceBadge = SOURCE_LABELS[sub.source] ?? SOURCE_LABELS.unknown;
                const isExpiringSoon = sub.daysUntilExpiry !== null && sub.daysUntilExpiry <= 7;
                return (
                  <div key={sub.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/admin/users/${sub.userId}`}
                          className="font-black text-night hover:text-crystal transition-colors truncate"
                        >
                          {sub.userFullName}
                        </Link>
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[0.65rem] font-black text-slate-600">
                          {ROLE_LABELS[sub.userRole] ?? sub.userRole}
                        </span>
                        <span className={`rounded-lg px-2 py-0.5 text-[0.65rem] font-black ${sourceBadge.color}`}>
                          {sourceBadge.label}
                        </span>
                      </div>
                      <p className="text-[0.65rem] font-bold text-slate-400 truncate">{sub.userEmail}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {sub.daysUntilExpiry !== null && (
                        <p className={`text-xs font-black ${isExpiringSoon ? "text-amber-600" : "text-slate-600"}`}>
                          {isExpiringSoon ? "⚠️ " : ""}{sub.daysUntilExpiry} gün
                        </p>
                      )}
                      <p className="text-[0.65rem] font-bold text-slate-400">
                        {sub.status === "trialing" ? "Deneme" : "Aktif"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Churn List */}
      {tab === "churn" && (
        <div className="divide-y divide-slate-100">
          {recentChurns.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-black text-emerald-700">🎉 Son 30 günde churn yok!</p>
              <p className="mt-1 text-xs font-bold text-slate-500">Tüm abonelikler aktif durumda.</p>
            </div>
          ) : (
            recentChurns.map((churn) => (
              <div key={churn.userId} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <Link
                    href={`/admin/users/${churn.userId}`}
                    className="font-black text-night hover:text-crystal transition-colors"
                  >
                    {churn.userFullName}
                  </Link>
                  <p className="text-[0.65rem] font-bold text-slate-400">{churn.userEmail}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-rose-600">İptal Etti</p>
                  <p className="text-[0.65rem] font-bold text-slate-400">
                    {churn.daysActive} gün aktif · {new Date(churn.canceledAt).toLocaleDateString("tr-TR")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
