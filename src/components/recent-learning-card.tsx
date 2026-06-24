"use client";

import Link from "next/link";

import type { LearningHistoryItem } from "@/lib/domain/learning";
import { useMessages } from "@/lib/i18n/locale-context";

const demoHistory: LearningHistoryItem[] = [
  {
    id: "demo-reel-watch",
    action_type: "reel_watch",
    points_awarded: 10,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-quiz",
    action_type: "quiz_complete",
    points_awarded: 10,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "demo-duel",
    action_type: "duel_win",
    points_awarded: 25,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
];

type RecentLearningCardProps = {
  history: LearningHistoryItem[];
  showPreview?: boolean;
};

export function RecentLearningCard({ history, showPreview = false }: RecentLearningCardProps) {
  const { recentLearning: rl, nav: n } = useMessages();
  const items = history.length > 0 ? history : showPreview ? demoHistory : [];

  function labelForAction(actionType: LearningHistoryItem["action_type"]) {
    if (actionType === "reel_watch") return rl.watchedMicro;
    if (actionType === "quiz_complete") return rl.completedQuiz;
    if (actionType === "focus_session") return rl.focusPomodoro;
    return rl.wonDuel;
  }

  function timeLabel(createdAt: string) {
    const minutes = Math.max(1, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000));
    if (minutes < 60) return rl.minutesAgo.replace("{minutes}", String(minutes));
    return rl.hoursAgo.replace("{hours}", String(Math.round(minutes / 60)));
  }

  return (
    <section className="-mx-4 bg-white px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="zigo-eyebrow text-slate-500">{rl.title}</p>
          <h2 className="zigo-title-sm mt-1 font-black text-night">{rl.heading}</h2>
        </div>
        <span className="zigo-meta-badge rounded-lg bg-slate-100 px-3 py-1 font-black text-night">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-lg bg-slate-50 px-4 py-4">
          <p className="zigo-body font-semibold text-slate-500">{rl.emptyDesc}</p>
          <div className="zigo-action-grid mt-3">
            <Link className="zigo-action-chip tap-scale rounded-lg bg-white text-crystal" href="/focus">
              {rl.focusLink}
            </Link>
            <Link className="zigo-action-chip tap-scale rounded-lg bg-white text-crystal" href="/micro">
              {n.micro}
            </Link>
            <Link className="zigo-action-chip tap-scale rounded-lg bg-white text-crystal" href="/learn">
              {rl.quizLink}
            </Link>
            <Link className="zigo-action-chip tap-scale rounded-lg bg-white text-crystal" href="/duels">
              {rl.duelsLink}
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-100">
          {items.map((item) => (
            <article className="flex items-center justify-between py-3" key={item.id}>
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-[0.65rem] font-black text-night">
                  {labelForAction(item.action_type).slice(0, 2)}
                </span>
                <div>
                  <p className="zigo-body font-black text-night">{labelForAction(item.action_type)}</p>
                  <p className="zigo-meta mt-0.5 font-bold text-slate-500">{timeLabel(item.created_at)}</p>
                </div>
              </div>
              <span className="zigo-meta-badge rounded-lg bg-slate-100 px-3 py-1 font-black text-night">
                +{item.points_awarded}
              </span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
