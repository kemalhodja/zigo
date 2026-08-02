import Link from "next/link";

import type { OrgDashboardSnapshot } from "@/lib/domain/org-dashboard";
import { listOrgDashboardMetricIds } from "@/lib/domain/org-dashboard";

export type OrgDashboardCopy = {
  eyebrow: string;
  titleInstitution: string;
  titlePlatform: string;
  titlePublisher: string;
  descInstitution: string;
  descPlatform: string;
  descPublisher: string;
  metricPosts7d: string;
  metricPostsTotal: string;
  metricFollowers: string;
  metricAreas: string;
  metricSponsored: string;
  metricOpenQuestions: string;
  areasEmpty: string;
  openStudio: string;
  openCreate: string;
  openQuestions: string;
  openAdvertise: string;
};

export function OrgDashboardPanel({
  snapshot,
  copy,
  embedded = false,
}: {
  snapshot: OrgDashboardSnapshot;
  copy: OrgDashboardCopy;
  embedded?: boolean;
}) {
  const title =
    snapshot.billingTier === "platform"
      ? copy.titlePlatform
      : snapshot.billingTier === "publisher"
        ? copy.titlePublisher
        : copy.titleInstitution;
  const description =
    snapshot.billingTier === "platform"
      ? copy.descPlatform
      : snapshot.billingTier === "publisher"
        ? copy.descPublisher
        : copy.descInstitution;

  const metricValues: Record<string, number> = {
    postsLast7Days: snapshot.postsLast7Days,
    postsTotal: snapshot.postsTotal,
    followers: snapshot.followers,
    assignedAreas: snapshot.assignedAreaCount,
    activeSponsored: snapshot.activeSponsoredCount,
    openQuestions: snapshot.openQuestionsInAreas,
  };

  const metricLabels: Record<string, string> = {
    postsLast7Days: copy.metricPosts7d,
    postsTotal: copy.metricPostsTotal,
    followers: copy.metricFollowers,
    assignedAreas: copy.metricAreas,
    activeSponsored: copy.metricSponsored,
    openQuestions: copy.metricOpenQuestions,
  };

  const metrics = listOrgDashboardMetricIds(snapshot.billingTier).map((id) => ({
    id,
    label: metricLabels[id] ?? id,
    value: metricValues[id] ?? 0,
  }));

  const shellClass =
    snapshot.billingTier === "platform"
      ? "border-indigo-100 from-indigo-50 to-violet-50"
      : snapshot.billingTier === "publisher"
        ? "border-amber-100 from-amber-50 to-orange-50"
        : "border-emerald-100 from-emerald-50 to-teal-50";

  return (
    <section
      className={`rounded-xl border bg-gradient-to-r px-4 py-4 ${shellClass} ${
        embedded ? "" : "-mx-4 rounded-none border-x-0 border-t-0"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{copy.eyebrow}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-black text-night">{title}</h3>
        <span className="rounded-lg bg-white px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.08em] text-slate-600">
          {snapshot.organizationLabel}
        </span>
      </div>
      <p className="mt-1 text-sm font-bold leading-6 text-slate-600">{description}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div className="rounded-lg bg-white p-3" key={metric.id}>
            <p className="text-lg font-black text-night">{metric.value.toLocaleString()}</p>
            <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
              {metric.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
          {copy.metricAreas}
        </p>
        {snapshot.assignedAreaNames.length === 0 ? (
          <p className="mt-1 text-sm font-bold text-slate-500">{copy.areasEmpty}</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {snapshot.assignedAreaNames.slice(0, 6).map((name) => (
              <span className="rounded-lg bg-white px-3 py-1 text-xs font-black text-night" key={name}>
                {name}
              </span>
            ))}
            {snapshot.assignedAreaNames.length > 6 ? (
              <span className="rounded-lg bg-white px-3 py-1 text-xs font-black text-slate-500">
                +{snapshot.assignedAreaNames.length - 6}
              </span>
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link className="rounded-lg bg-white px-3 py-2 text-xs font-black text-night" href="/teacher">
          {copy.openStudio}
        </Link>
        <Link className="rounded-lg bg-white px-3 py-2 text-xs font-black text-night" href="/create">
          {copy.openCreate}
        </Link>
        <Link className="rounded-lg bg-white px-3 py-2 text-xs font-black text-night" href="/questions">
          {copy.openQuestions}
        </Link>
        <Link className="rounded-lg bg-white px-3 py-2 text-xs font-black text-night" href="/profile">
          {copy.openAdvertise}
        </Link>
      </div>
    </section>
  );
}
