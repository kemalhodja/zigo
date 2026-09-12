"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CohortWeek, DailySignupPoint, PlatformHealthScore, RevenueSplit, RoleDistributionPoint } from "@/lib/domain/admin-analytics";

type AnalyticsDashboardClientProps = {
  // Eski props (geriye uyumlu)
  activationData: { step: string; count: number }[];
  retentionData: { name: string; value: number }[];
  revenueData: { month: string; amount: number }[];
  // Yeni props
  dailySignups?: DailySignupPoint[];
  roleDistribution?: RoleDistributionPoint[];
  cohortRetention?: CohortWeek[];
  platformHealth?: PlatformHealthScore;
  revenueSplit?: RevenueSplit[];
};

const COLORS = ["#8b5cf6", "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#06b6d4"];

export function AdminAnalyticsDashboard({
  activationData,
  retentionData,
  revenueData,
  dailySignups = [],
  roleDistribution = [],
  cohortRetention = [],
  platformHealth,
  revenueSplit = [],
}: AnalyticsDashboardClientProps) {
  const totalUsers = roleDistribution.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-6">
      {/* Platform Sağlık Skoru */}
      {platformHealth && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">Platform Sağlığı</p>
              <p className="mt-1 text-3xl font-black" style={{ color: platformHealth.color }}>
                {platformHealth.total}<span className="text-lg">/100</span>
              </p>
              <span
                className="mt-1 inline-block rounded-lg px-2 py-0.5 text-xs font-black"
                style={{ background: `${platformHealth.color}18`, color: platformHealth.color }}
              >
                {platformHealth.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(platformHealth.breakdown).map(([key, val]) => {
                const labels: Record<string, string> = { retention: "Retention", moderation: "Moderasyon", coverage: "Feed", growth: "Büyüme" };
                return (
                  <div key={key} className="rounded-lg bg-slate-50 p-2 text-center">
                    <p className="text-base font-black text-night">{val}/25</p>
                    <p className="text-[0.6rem] font-black uppercase text-slate-500">{labels[key]}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Günlük Kayıt Eğrisi */}
        {dailySignups.length > 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:col-span-2">
            <h3 className="mb-4 text-sm font-black text-night">📈 Günlük Kullanıcı Kaydı (Son 30 Gün)</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySignups}>
                  <defs>
                    <linearGradient id="gradStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradTeachers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 24px rgb(0 0 0/0.12)", fontSize: "12px" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }} />
                  <Area type="monotone" dataKey="students" name="Öğrenci" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradStudents)" />
                  <Area type="monotone" dataKey="teachers" name="Öğretmen" stroke="#10b981" strokeWidth={2} fill="url(#gradTeachers)" />
                  <Area type="monotone" dataKey="parents" name="Veli" stroke="#f59e0b" strokeWidth={2} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-sm font-black text-night">Öğretmen Aktivasyon Hunisi</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activationData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="step" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0/0.1)" }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Rol Dağılımı */}
        {roleDistribution.length > 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <h3 className="mb-1 text-sm font-black text-night">👥 Rol Dağılımı</h3>
            <p className="mb-4 text-[0.65rem] font-bold text-slate-400">Toplam {totalUsers.toLocaleString("tr-TR")} kullanıcı</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="label"
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`role-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: unknown, name: unknown) => [`${String(val)} kullanıcı`, String(name)]}
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 24px rgb(0 0 0/0.12)", fontSize: "12px" }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-sm font-black text-night">Öğrenci Etkileşim Dağılımı</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={retentionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {retentionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Gelir Kırılımı */}
        {revenueSplit.length > 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-sm font-black text-night">💰 Gelir Kırılımı</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueSplit} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    tickFormatter={(v: unknown) => `₺${(Number(v) / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="source" type="category" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: unknown) => [`₺${Number(v).toLocaleString("tr-TR")}`, "Gelir"]}
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 24px rgb(0 0 0/0.12)", fontSize: "12px" }}
                  />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={24}>
                    {revenueSplit.map((entry, index) => (
                      <Cell key={`rev-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:col-span-2">
            <h3 className="mb-4 text-sm font-black text-night">Aylık Büyüme & Gelir Trendi</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                  <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Cohort Retention Tablosu */}
      {cohortRetention.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-black text-night">🔄 Haftalık Cohort Retention</h3>
            <p className="text-xs font-bold text-slate-500">Her kohortun 7, 14 ve 30 günlük geri dönüş oranı</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 text-[0.65rem] font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Kohort</th>
                  <th className="px-4 py-3 text-center">Boyut</th>
                  <th className="px-4 py-3 text-center">7 Gün</th>
                  <th className="px-4 py-3 text-center">14 Gün</th>
                  <th className="px-4 py-3 text-center">30 Gün</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cohortRetention.map((row) => (
                  <tr key={row.week}>
                    <td className="px-4 py-3 font-black text-night">{row.week}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-600">{row.cohortSize}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-lg px-2 py-0.5 font-black ${row.day7Pct >= 40 ? "bg-emerald-50 text-emerald-700" : row.day7Pct >= 20 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                        {row.day7Pct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-lg px-2 py-0.5 font-black ${row.day14Pct >= 30 ? "bg-emerald-50 text-emerald-700" : row.day14Pct >= 15 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                        {row.day14Pct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-lg px-2 py-0.5 font-black ${row.day30Pct >= 20 ? "bg-emerald-50 text-emerald-700" : row.day30Pct >= 10 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                        {row.day30Pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
