import { type ExamGoalType,getExamCountdown } from "@/lib/domain/exam-countdown";

type ExamCountdownBannerProps = {
  goalExam: ExamGoalType;
};

export function ExamCountdownBanner({ goalExam }: ExamCountdownBannerProps) {
  const countdown = getExamCountdown(goalExam);
  if (!countdown) return null;

  return (
    <section className="-mx-4 border-y border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Sınav takvimi</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-night">{countdown.label}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Sınava kalan gün: <span className="font-black text-amber-700">{countdown.daysRemaining}</span>
          </p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm ring-1 ring-amber-100">
          <p className="text-3xl font-black text-amber-600">{countdown.daysRemaining}</p>
          <p className="text-[0.65rem] font-black uppercase tracking-wide text-slate-500">gün</p>
        </div>
      </div>
    </section>
  );
}
