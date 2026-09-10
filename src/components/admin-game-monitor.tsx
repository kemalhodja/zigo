"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  ActiveGameSession,
  GameTypeStats,
  NightCurfewViolation,
  TimeLimitAlert,
  XpFarmSuspect,
} from "@/lib/domain/admin-games";

type AdminGameMonitorProps = {
  activeSessions: ActiveGameSession[];
  nightViolations: NightCurfewViolation[];
  limitAlerts: TimeLimitAlert[];
  xpFarmSuspects: XpFarmSuspect[];
  gameTypeStats: GameTypeStats[];
};

type MonitorTab = "live" | "violations" | "limits" | "xpfarm" | "stats";

function fmtSeconds(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}s ${m}d`;
  if (m > 0) return `${m}d ${s}s`;
  return `${s}s`;
}

function PulsingDot({ color = "emerald" }: { color?: string }) {
  return (
    <span className="relative flex size-2.5">
      <span className={`absolute inline-flex size-full animate-ping rounded-full bg-${color}-400 opacity-75`} />
      <span className={`relative inline-flex size-2.5 rounded-full bg-${color}-500`} />
    </span>
  );
}

export function AdminGameMonitor({
  activeSessions,
  nightViolations,
  limitAlerts,
  xpFarmSuspects,
  gameTypeStats,
}: AdminGameMonitorProps) {
  const [tab, setTab] = useState<MonitorTab>("live");

  const overLimitCount = limitAlerts.filter((a) => a.isOver).length;
  const nightCount = nightViolations.length;
  const xpHighRisk = xpFarmSuspects.filter((s) => s.riskLevel === "high").length;

  const totalGameSessions = useMemo(
    () => gameTypeStats.reduce((s, g) => s + g.sessionCount, 0),
    [gameTypeStats],
  );

  const tabs: { id: MonitorTab; label: string; badge?: number; alert?: boolean }[] = [
    { id: "live", label: `🟢 Canlı (${activeSessions.length})` },
    { id: "violations", label: "🌙 Gece İhlali", badge: nightCount, alert: nightCount > 0 },
    { id: "limits", label: "⏱ Süre Aşımı", badge: overLimitCount, alert: overLimitCount > 0 },
    { id: "xpfarm", label: "⚠️ XP Farm", badge: xpFarmSuspects.length, alert: xpHighRisk > 0 },
    { id: "stats", label: "📊 İstatistikler" },
  ];

  return (
    <section className="-mx-4 bg-white">
      {/* Header */}
      <div className="border-b border-slate-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-night">🎮 Oyun Salonu Monitörü</h3>
            <p className="mt-1 text-xs font-bold text-slate-500">
              Canlı oturumlar, gece yasağı, süre aşımı ve XP farm tespiti
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PulsingDot color="emerald" />
            <span className="text-xs font-black text-emerald-600">Canlı İzleme</span>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-4 pb-3 pt-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative shrink-0 rounded-xl px-3 py-2 text-xs font-black transition-all ${
              tab === t.id
                ? "bg-crystal text-white"
                : t.alert
                  ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span className={`absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full text-[0.6rem] font-black text-white ${t.alert ? "bg-rose-500" : "bg-slate-400"}`}>
                {t.badge > 9 ? "9+" : t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Live Sessions */}
      {tab === "live" && (
        <div className="divide-y divide-slate-100">
          {activeSessions.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-2xl">🎮</p>
              <p className="mt-2 text-sm font-black text-night">Şu an aktif oyun oturumu yok</p>
              <p className="mt-1 text-xs font-bold text-slate-500">Son 5 dakikada oynayan kullanıcı bulunmuyor.</p>
            </div>
          ) : (
            activeSessions.map((session) => (
              <div
                key={session.userId}
                className={`flex items-center justify-between gap-3 px-4 py-3 ${
                  session.isNightCurfewViolation ? "bg-rose-50" : session.isOverDailyLimit ? "bg-amber-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <PulsingDot color={session.isNightCurfewViolation || session.isOverDailyLimit ? "rose" : "emerald"} />
                  <div>
                    <Link
                      href={`/admin/users/${session.userId}`}
                      className="font-black text-night hover:text-crystal transition-colors"
                    >
                      {session.userFullName}
                    </Link>
                    <p className="text-[0.65rem] font-bold text-slate-500">
                      {session.gameType} · Son: {new Date(session.lastActiveAt).toLocaleTimeString("tr-TR")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-night">{fmtSeconds(session.totalTodaySeconds)}</p>
                  <div className="flex flex-col gap-0.5 items-end">
                    {session.isNightCurfewViolation && (
                      <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[0.6rem] font-black text-rose-700">🌙 Gece</span>
                    )}
                    {session.isOverDailyLimit && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[0.6rem] font-black text-amber-700">⏱ Limit Aşıldı</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Night Violations */}
      {tab === "violations" && (
        <div className="divide-y divide-slate-100">
          {nightViolations.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-2xl">🌙</p>
              <p className="mt-2 text-sm font-black text-emerald-700">Bugün gece yasağı ihlali yok!</p>
              <p className="mt-1 text-xs font-bold text-slate-500">22:00–08:00 arasında oynayan kullanıcı bulunmuyor.</p>
            </div>
          ) : (
            nightViolations.map((v, i) => (
              <div key={i} className="flex items-center justify-between gap-3 bg-rose-50/50 px-4 py-3">
                <div>
                  <Link
                    href={`/admin/users/${v.userId}`}
                    className="font-black text-night hover:text-crystal transition-colors"
                  >
                    {v.userFullName}
                  </Link>
                  <p className="text-[0.65rem] font-bold text-slate-500">{v.gameType}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-rose-700">
                    {new Date(v.violationAt).toLocaleTimeString("tr-TR")}
                  </p>
                  <p className="text-[0.65rem] font-bold text-slate-400">{fmtSeconds(v.durationSeconds)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Daily Limit Alerts */}
      {tab === "limits" && (
        <div className="divide-y divide-slate-100">
          {limitAlerts.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-2xl">⏱</p>
              <p className="mt-2 text-sm font-black text-emerald-700">Süre uyarısı verecek kullanıcı yok</p>
            </div>
          ) : (
            limitAlerts.map((alert) => (
              <div key={alert.userId} className={`px-4 py-3 ${alert.isOver ? "bg-amber-50" : ""}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Link
                      href={`/admin/users/${alert.userId}`}
                      className="font-black text-night hover:text-crystal transition-colors"
                    >
                      {alert.userFullName}
                    </Link>
                    <p className="text-[0.65rem] font-bold text-slate-500">
                      Bugün: {fmtSeconds(alert.totalTodaySeconds)} / 120 dk
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black ${alert.isOver ? "text-amber-700" : "text-slate-600"}`}>
                      {alert.percentUsed}%
                    </p>
                    {alert.isOver && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[0.6rem] font-black text-amber-700">
                        Limit Aşıldı
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-2 rounded-full transition-all ${alert.isOver ? "bg-amber-500" : "bg-crystal"}`}
                    style={{ width: `${Math.min(alert.percentUsed, 100)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* XP Farm */}
      {tab === "xpfarm" && (
        <div className="divide-y divide-slate-100">
          {xpFarmSuspects.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-2xl">✅</p>
              <p className="mt-2 text-sm font-black text-emerald-700">XP farming şüphesi tespit edilmedi</p>
              <p className="mt-1 text-xs font-bold text-slate-500">Son 24 saatte anormal oturum örüntüsü yok.</p>
            </div>
          ) : (
            xpFarmSuspects.map((suspect, i) => (
              <div
                key={i}
                className={`flex items-center justify-between gap-3 px-4 py-3 ${
                  suspect.riskLevel === "high" ? "bg-rose-50" : "bg-amber-50"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/users/${suspect.userId}`}
                      className="font-black text-night hover:text-crystal transition-colors"
                    >
                      {suspect.userFullName}
                    </Link>
                    <span className={`rounded-lg px-2 py-0.5 text-[0.65rem] font-black ${
                      suspect.riskLevel === "high"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {suspect.riskLevel === "high" ? "🔴 Yüksek Risk" : "🟡 Orta Risk"}
                    </span>
                  </div>
                  <p className="text-[0.65rem] font-bold text-slate-500">
                    {suspect.gameType} · {suspect.sessionCount} oturum · Ort. {fmtSeconds(suspect.avgSessionSeconds)}/oturum
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-600">{fmtSeconds(suspect.totalSeconds)}</p>
                  <p className="text-[0.65rem] font-bold text-slate-400">toplam süre</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Stats */}
      {tab === "stats" && (
        <div className="px-4 py-4">
          <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">
            Son 7 Gün — {totalGameSessions.toLocaleString("tr-TR")} toplam oturum
          </p>
          <div className="space-y-3">
            {gameTypeStats.map((stat) => {
              const pct = totalGameSessions > 0
                ? Math.round((stat.sessionCount / totalGameSessions) * 100)
                : 0;
              return (
                <div key={stat.gameType}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-night">{stat.label}</p>
                    <div className="flex items-center gap-3 text-right">
                      <span className="text-[0.65rem] font-bold text-slate-500">
                        {stat.uniquePlayers} oyuncu · Ort. {fmtSeconds(stat.avgSeconds)}
                      </span>
                      <span className="text-xs font-black text-crystal">{pct}%</span>
                    </div>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-crystal to-indigo-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
