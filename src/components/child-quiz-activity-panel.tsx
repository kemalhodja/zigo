import type { ChildQuizActivityItem } from "@/lib/domain/parent-dashboard";

type ChildQuizActivityPanelProps = {
  childName: string;
  activity: ChildQuizActivityItem[];
  labels: {
    title: string;
    empty: string;
    score: string;
    points: string;
    questions: string;
    completed: string;
  };
};

export function ChildQuizActivityPanel({ childName, activity, labels }: ChildQuizActivityPanelProps) {
  return (
    <section className="rounded-lg border border-violet-100 bg-violet-50/60 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{labels.title}</p>
      <p className="mt-1 text-sm font-bold text-slate-600">{childName}</p>

      {activity.length === 0 ? (
        <p className="mt-3 rounded-lg bg-white px-3 py-3 text-sm font-bold text-slate-500">{labels.empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {activity.map((item) => (
            <li className="rounded-lg bg-white px-3 py-3" key={item.attempt_id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-night">{item.quiz_title}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {labels.score.replace("{score}", String(item.score_percent))}
                    {" · "}
                    {labels.questions
                      .replace("{correct}", String(item.correct_answers))
                      .replace("{total}", String(item.total_questions))}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-black text-crystal">
                    {labels.points.replace("{points}", String(item.points_awarded))}
                  </p>
                  <p className="mt-0.5 text-[0.65rem] font-bold text-slate-400">
                    {labels.completed.replace(
                      "{date}",
                      new Date(item.completed_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                      }),
                    )}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
