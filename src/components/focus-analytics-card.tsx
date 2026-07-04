import { getWeeklyGoalProgress, type StudentFocusAnalytics } from "@/lib/domain/focus-analytics";
import { FOCUS_SESSION_POINTS } from "@/lib/domain/focus-gamification";
import type { Messages } from "@/lib/i18n/types";

type FocusAnalyticsCardProps = {
  analytics: StudentFocusAnalytics;
  messages: Messages;
  showPreview?: boolean;
};

export function FocusAnalyticsCard({ analytics, messages, showPreview = false }: FocusAnalyticsCardProps) {
  const fc = messages.focusCard;
  const weeklyProgress = getWeeklyGoalProgress(analytics.weeklyCompleted, analytics.weeklyGoal);

  return (
    <section className="-mx-4 space-y-4 bg-white px-4 py-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-crystal">{fc.analyticsTitle}</p>
          <h2 className="mt-1 text-xl font-black text-night">{fc.studyRhythm}</h2>
        </div>
        {showPreview ? (
          <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">{fc.preview}</span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatTile label={fc.thisWeek} value={`${analytics.focusMinutesWeek} ${fc.min}`} />
        <StatTile label={fc.pomodoros} value={`${analytics.weeklyCompleted}/${analytics.weeklyGoal}`} />
        <StatTile label={fc.allTime} value={`${analytics.completedSessions} ${fc.sessions}`} />
        <StatTile
          hint={fc.eachPoints.replace("{points}", String(FOCUS_SESSION_POINTS))}
          label={fc.focusPoints}
          value={`+${analytics.pointsFromFocus}`}
        />
      </div>

      <div>
        <div className="flex items-center justify-between text-xs font-black text-slate-500">
          <span>{fc.weeklyGoal}</span>
          <span>{Math.round(weeklyProgress)}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <span className="block h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" style={{ width: `${weeklyProgress}%` }} />
        </div>
        <p className="mt-2 text-xs font-bold text-slate-500">
          {fc.sharedMoments.replace("{count}", String(analytics.sharedMoments))} ·{" "}
          {analytics.activeSession ? fc.sessionInProgress : fc.noActiveSession}
        </p>
      </div>
    </section>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-3">
      <p className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-night">{value}</p>
      {hint ? <p className="mt-0.5 text-[0.62rem] font-bold text-slate-500">{hint}</p> : null}
    </div>
  );
}
