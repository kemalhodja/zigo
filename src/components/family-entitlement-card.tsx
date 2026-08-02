import Link from "next/link";

type FamilyEntitlementCardProps = {
  childCount: number;
  coveredChildCount: number;
  childrenCovered: boolean;
  copy: {
    eyebrow: string;
    titleActive: string;
    titleLocked: string;
    descActive: string;
    descLocked: string;
    coveredLabel: string;
    openPlans: string;
    openFamily: string;
  };
};

export function FamilyEntitlementCard({
  childCount,
  coveredChildCount,
  childrenCovered,
  copy,
}: FamilyEntitlementCardProps) {
  if (childCount <= 0) return null;

  return (
    <section
      className={`-mx-4 border-y px-4 py-4 ${
        childrenCovered
          ? "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white"
          : "border-amber-100 bg-gradient-to-br from-amber-50 to-white"
      }`}
    >
      <p
        className={`text-xs font-black uppercase tracking-[0.18em] ${
          childrenCovered ? "text-emerald-700" : "text-amber-700"
        }`}
      >
        {copy.eyebrow}
      </p>
      <h2 className="mt-2 text-lg font-black text-night">
        {childrenCovered ? copy.titleActive : copy.titleLocked}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {childrenCovered ? copy.descActive : copy.descLocked}
      </p>
      <p className="mt-3 text-sm font-black text-night">
        {copy.coveredLabel
          .replace("{covered}", String(coveredChildCount))
          .replace("{total}", String(childCount))}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {childrenCovered ? (
          <Link
            className="tap-scale inline-flex rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-black text-white"
            href="/family"
          >
            {copy.openFamily}
          </Link>
        ) : (
          <Link
            className="tap-scale inline-flex rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2.5 text-xs font-black text-night"
            href="#zigo-plus-plans"
          >
            {copy.openPlans}
          </Link>
        )}
      </div>
    </section>
  );
}
