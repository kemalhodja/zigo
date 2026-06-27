import type { TeacherExpertiseSelection } from "@/lib/domain/platform-activity";
import {
  expertiseTrackLabel,
  expertiseTrackPillClass,
} from "@/lib/domain/teacher-expertise";

type ExpertiseMatrixDisplayProps = {
  selections: TeacherExpertiseSelection[];
  title?: string;
  className?: string;
};

export function ExpertiseMatrixDisplay({
  selections,
  title = "Uzmanlık Matrisi",
  className = "",
}: ExpertiseMatrixDisplayProps) {
  if (selections.length === 0) return null;

  return (
    <section className={`rounded-2xl border border-slate-100 bg-white p-4 ${className}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">{title}</p>
      <p className="mt-1 text-sm text-slate-600">Alt dallarda uzmanlık seviyesi</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {selections.map((selection) => {
          const boost = selection.review_boost_score;
          return (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ring-1 ring-inset ${expertiseTrackPillClass(selection.track_slug)}`}
              key={selection.track_slug}
            >
              {expertiseTrackLabel(selection.track_slug)}
              {boost > 0 ? (
                <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[0.58rem] font-black text-night">
                  +{boost}
                </span>
              ) : null}
            </span>
          );
        })}
      </div>
    </section>
  );
}
