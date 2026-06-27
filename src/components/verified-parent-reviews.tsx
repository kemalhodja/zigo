import type { VerifiedParentReview } from "@/lib/domain/platform-activity";
import { expertiseTrackLabel, expertiseTrackPillClass } from "@/lib/domain/teacher-expertise";

type VerifiedParentReviewsProps = {
  reviews: VerifiedParentReview[];
  className?: string;
};

export function VerifiedParentReviews({ reviews, className = "" }: VerifiedParentReviewsProps) {
  if (reviews.length === 0) return null;

  return (
    <section className={`rounded-2xl border border-slate-100 bg-white p-4 ${className}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-700">Veli Referansları</p>
      <p className="mt-1 text-sm text-slate-600">Doğrulanmış ders yorumları</p>
      <div className="mt-3 space-y-3">
        {reviews.map((review) => (
          <article className="rounded-xl border border-slate-100 bg-slate-50/80 p-3" key={review.id}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-amber-600">
                {"★".repeat(review.rating)}
                <span className="text-slate-300">{"★".repeat(5 - review.rating)}</span>
              </span>
              <span className="text-[0.62rem] font-bold text-slate-400">
                {new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(review.createdAt))}
              </span>
            </div>
            {review.comment ? (
              <p className="mt-2 text-sm leading-6 text-slate-700">&ldquo;{review.comment}&rdquo;</p>
            ) : null}
            {review.matchedTrackSlugs.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {review.matchedTrackSlugs.map((slug) => (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.58rem] font-black ring-1 ring-inset ${expertiseTrackPillClass(slug)}`}
                    key={slug}
                  >
                    {expertiseTrackLabel(slug)}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
