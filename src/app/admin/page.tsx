import Link from "next/link";

import { AdminBankTransferActions } from "@/components/admin-bank-transfer-actions";
import { AdminBillingGrantActions } from "@/components/admin-billing-grant-actions";
import { AdminBillingGrantLedger } from "@/components/admin-billing-grant-ledger";
import { AdminBroadcastButton } from "@/components/admin-broadcast-button";
import { AdminLivePulse } from "@/components/admin-live-pulse";
import { AdminRedemptionStatus } from "@/components/admin-redemption-status";
import { AdminStockForm } from "@/components/admin-stock-form";
import { AdminStripeCampaignPanel } from "@/components/admin-stripe-campaign-panel";
import { AdminStudentDocumentActions } from "@/components/admin-student-document-actions";
import { AdminTeacherAreaForm } from "@/components/admin-teacher-area-form";
import { AdminUserActions } from "@/components/admin-user-actions";
import { AdminUserSearch } from "@/components/admin-user-search";
import { StateCard } from "@/components/state-card";
import { hasSupabaseEnv } from "@/lib/config";
import {
  getAdminStoreProducts,
  getAdminStoreRedemptions,
  getStudentDocumentQueue,
  getUserVerificationQueue,
  isCurrentUserPlatformAdmin,
} from "@/lib/domain/admin";
import { listRecentAdminBillingGrants } from "@/lib/domain/admin-billing-grant";
import { getPendingBankTransferQueue } from "@/lib/domain/bank-transfer";
import { getOrganizationOption } from "@/lib/domain/education-organization";
import { evaluateExpansionReadiness } from "@/lib/domain/expansion-readiness";
import {
  type DensityBand,
  EXAM_DENSITY_AGE_GROUPS,
  formatCoveragePercent,
  getAreaFeedDensityMetrics,
  getVerifiedInactiveTeachers,
  parseDensityAgeGroups,
  PRIORITY_EXAM_AGE_GROUPS,
} from "@/lib/domain/feed-density";
import { LAUNCH_COVERAGE_TARGET, LAUNCH_PRIORITY_TRACKS } from "@/lib/domain/launch-scope";
import {
  formatRetentionPercent,
  getLearningActionRetention,
  LEARNING_RETENTION_TARGET,
} from "@/lib/domain/learning-retention";
import { isAiModerationConfigured } from "@/lib/domain/moderation-ai";
import { getModerationSlaReport,MODERATION_SLA_HOURS } from "@/lib/domain/moderation-sla";
import { getCurrentProfile, getEducationAreas, parseOrganizationType } from "@/lib/domain/profiles";
import { getRevenueOpsSnapshot } from "@/lib/domain/revenue-ops";
import { getTeacherActivationFunnel } from "@/lib/domain/verification-activation";
import { getServerMessages } from "@/lib/i18n/server";
import { createAdminClient, hasServiceRoleEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type AdminPageProps = {
  searchParams: Promise<{ densityGroups?: string }>;
};

function densityBandClass(band: DensityBand) {
  if (band === "healthy") return "bg-emerald-50 text-emerald-700";
  if (band === "thin") return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-700";
}

function UserRow({
  user,
  areas,
  labels,
}: {
  user: Awaited<ReturnType<typeof getUserVerificationQueue>>[number];
  areas: Awaited<ReturnType<typeof getEducationAreas>>;
  labels: {
    verified: string;
    pendingVerification: string;
  };
}) {
  const organizationLabel = getOrganizationOption(parseOrganizationType(user.organization_type))?.label;

  return (
    <div className="grid gap-3 border-b border-slate-100 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-night">{user.full_name}</p>
          <p className="text-xs font-bold text-slate-500">
            {user.email} • <span className="uppercase text-crystal">{user.role}</span>
            {organizationLabel ? ` (${organizationLabel})` : ""}
          </p>
          <p className="mt-1 text-xs font-black text-crystal">
            {user.is_verified ? labels.verified : labels.pendingVerification}
          </p>
        </div>
        <AdminUserActions 
          isVerified={user.is_verified} 
          userId={user.id} 
          userName={user.full_name} 
          accountStatus={user.account_status} 
        />
      </div>
      <AdminBillingGrantActions role={user.role} userId={user.id} userName={user.full_name} />
      {user.role === "teacher" ? <AdminTeacherAreaForm areas={areas} teacherId={user.id} /> : null}
    </div>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const m = await getServerMessages();
  const a = m.ops.admin;
  const c = m.ops.common;
  const params = await searchParams;
  const densityAgeGroups = parseDensityAgeGroups(params.densityGroups);
  const densityFilterKey = densityAgeGroups.join(",");
  const priorityFilterKey = PRIORITY_EXAM_AGE_GROUPS.join(",");
  const isPriorityFilter = densityFilterKey === priorityFilterKey;

  if (!hasSupabaseEnv()) {
    return (
      <StateCard
        action={
          <Link className="font-black text-crystal" href="/setup">
            {a.openSetup}
          </Link>
        }
        description={a.needsSupabaseDesc}
        title={a.needsSupabaseTitle}
      />
    );
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    return (
      <StateCard
        action={
          <Link className="font-black text-crystal" href="/auth?next=/admin">
            {c.signIn}
          </Link>
        }
        description={a.signInRequiredDesc}
        title={a.signInRequiredTitle}
      />
    );
  }

  const isAdmin = await isCurrentUserPlatformAdmin(supabase);

  if (!isAdmin) {
    return (
      <StateCard
        action={
          <Link className="font-black text-crystal" href="/setup">
            {a.openSetupGuide}
          </Link>
        }
        description={a.noAccessDesc}
        title={a.noAccessTitle}
      />
    );
  }

  const adminClient = createAdminClient();
  const metricsClient = adminClient ?? supabase;
  const serviceRoleReady = hasServiceRoleEnv();

  const [users, products, redemptions, areas, studentDocuments, bankTransfers, densityReport, inactiveTeachers, activationFunnel, learningRetention, moderationSla, revenueOps, billingGrants] =
    await Promise.all([
      getUserVerificationQueue(supabase),
      getAdminStoreProducts(supabase),
      getAdminStoreRedemptions(supabase),
      getEducationAreas(supabase),
      getStudentDocumentQueue(supabase),
      getPendingBankTransferQueue(supabase),
      getAreaFeedDensityMetrics(metricsClient, { ageGroups: densityAgeGroups, sinceDays: 7 }),
      getVerifiedInactiveTeachers(metricsClient, { sinceDays: 7 }),
      getTeacherActivationFunnel(metricsClient),
      getLearningActionRetention(metricsClient),
      getModerationSlaReport(supabase),
      getRevenueOpsSnapshot(metricsClient),
      adminClient ? listRecentAdminBillingGrants(adminClient, 12).catch(() => []) : Promise.resolve([]),
    ]);

  const pendingUsers = users.filter((u) => !u.is_verified);
  const verifiedUsers = users.filter((u) => u.is_verified);
  const bandLabels: Record<DensityBand, string> = {
    empty: a.densityBandEmpty,
    thin: a.densityBandThin,
    healthy: a.densityBandHealthy,
  };
  const coverageOnTarget = densityReport.coverageRatio >= LAUNCH_COVERAGE_TARGET;
  const expansion = evaluateExpansionReadiness({
    feedCoverageRatio: densityReport.coverageRatio,
    moderationOnTarget: moderationSla.onTarget,
    moderationBreaches: moderationSla.breachedReports + moderationSla.breachedSafety,
    learningRetentionRatio: learningRetention.retentionRatio,
    learningCohortSize: learningRetention.cohortSize,
  });

  const auditItems = [
    { label: a.queuePendingTeachers, value: activationFunnel.pendingVerification },
    { label: a.queueVerifiedNoAreas, value: activationFunnel.verifiedMissingAreas },
    { label: a.queueVerifiedNoPosts, value: activationFunnel.verifiedNoPosts },
    { label: a.queueActivatedTeachers, value: activationFunnel.activated },
    {
      label: a.queueD7Retention,
      value: `${learningRetention.retainedCount}/${learningRetention.cohortSize} (${formatRetentionPercent(learningRetention.retentionRatio)})`,
    },
    {
      label: a.queueModerationSla,
      value: moderationSla.breachedReports + moderationSla.breachedSafety,
    },
    {
      label: a.queueFeedCoverage,
      value: `${densityReport.areasWithWeeklyCreator}/${densityReport.priorityAreaCount} (${formatCoveragePercent(densityReport.coverageRatio)})`,
    },
    { label: a.queueRevenuePremium, value: revenueOps.activePremiumCount },
    {
      label: a.queueExpansionGate,
      value: `${expansion.readyCount}/${expansion.totalCount}`,
    },
    { label: a.queueInactiveTeachers, value: inactiveTeachers.length },
    { label: a.queueStudentDocs, value: studentDocuments.length },
    { label: a.queueBankTransfers, value: bankTransfers.length },
    { label: a.queueStoreOrders, value: redemptions.length },
    { label: a.queueStock, value: products.length },
  ];

  return (
    <div className="space-y-5">
      <AdminLivePulse
        aiConfigured={isAiModerationConfigured()}
        initialModerationBreaches={moderationSla.breachedReports + moderationSla.breachedSafety}
        initialPendingBankTransfers={bankTransfers.length}
        initialPendingUsers={pendingUsers.length}
      />

      <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{a.eyebrow}</p>
            <h2 className="mt-1 text-2xl font-black text-night">{a.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{a.desc}</p>
          </div>
          <AdminBroadcastButton />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-block rounded-lg bg-violet-50 px-3 py-1 text-xs font-black text-crystal">
            {a.platformFocus}
          </span>
          <span className="inline-block rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
            {a.launchFreezeLabel}
          </span>
        </div>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <h3 className="text-sm font-black text-night">{a.activationFunnelTitle}</h3>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{a.activationFunnelDesc}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-lg font-black text-night">{activationFunnel.pendingVerification}</p>
            <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
              {a.queuePendingTeachers}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-lg font-black text-night">{activationFunnel.verifiedMissingAreas}</p>
            <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
              {a.queueVerifiedNoAreas}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-lg font-black text-night">{activationFunnel.verifiedNoPosts}</p>
            <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
              {a.queueVerifiedNoPosts}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-lg font-black text-night">{activationFunnel.activated}</p>
            <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
              {a.queueActivatedTeachers}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs font-bold text-slate-500">
          {a.queueFeedCoverage}: {formatCoveragePercent(densityReport.coverageRatio)} · hedef{" "}
          {Math.round(LAUNCH_COVERAGE_TARGET * 100)}% ({LAUNCH_PRIORITY_TRACKS.join(" · ")})
          {coverageOnTarget ? " · hedefte" : " · altında"}
        </p>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <h3 className="text-sm font-black text-night">{a.retentionTitle}</h3>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{a.retentionDesc}</p>
        {!serviceRoleReady ? (
          <p className="mt-2 text-xs font-bold leading-5 text-amber-700">{a.retentionNeedsServiceRole}</p>
        ) : null}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-lg font-black text-night">{learningRetention.cohortSize}</p>
            <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
              {a.retentionCohort}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-lg font-black text-night">{learningRetention.retainedCount}</p>
            <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
              {a.retentionReturned}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-lg font-black text-night">
              {formatRetentionPercent(learningRetention.retentionRatio)}
            </p>
            <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
              {a.retentionRate}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p
              className={`text-sm font-black ${
                learningRetention.onTarget ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {learningRetention.onTarget ? a.retentionOnTarget : a.retentionBelowTarget}
            </p>
            <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
              ≥ {Math.round(LEARNING_RETENTION_TARGET * 100)}%
            </p>
          </div>
        </div>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <h3 className="text-sm font-black text-night">{a.moderationSlaTitle}</h3>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{a.moderationSlaDesc}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-lg font-black text-night">{moderationSla.openReports}</p>
            <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
              {a.moderationSlaOpen}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className={`text-lg font-black ${moderationSla.breachedReports > 0 ? "text-amber-700" : "text-night"}`}>
              {moderationSla.breachedReports}
            </p>
            <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
              {a.moderationSlaBreachReports}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className={`text-lg font-black ${moderationSla.breachedSafety > 0 ? "text-amber-700" : "text-night"}`}>
              {moderationSla.breachedSafety}
            </p>
            <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
              {a.moderationSlaBreachText}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className={`text-sm font-black ${moderationSla.onTarget ? "text-emerald-700" : "text-amber-700"}`}>
              {moderationSla.onTarget ? a.retentionOnTarget : a.retentionBelowTarget}
            </p>
            <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
              {a.moderationSlaMedian}
              {moderationSla.medianResolveHours == null
                ? ""
                : `: ${moderationSla.medianResolveHours.toFixed(1)}h`}
            </p>
          </div>
        </div>
        <Link className="mt-3 inline-flex text-xs font-black text-crystal" href="/moderation">
          {a.linkModeration}
        </Link>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <h3 className="text-sm font-black text-night">{a.revenueOpsTitle}</h3>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{a.revenueOpsDesc}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-lg font-black text-night">{revenueOps.activePremiumCount}</p>
            <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
              {a.revenuePremium}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-lg font-black text-night">{revenueOps.orgPremiumCount}</p>
            <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
              {a.revenueOrgPremium}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-lg font-black text-night">{revenueOps.individualPremiumCount}</p>
            <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
              {a.revenueIndividualPremium}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-lg font-black text-night">{revenueOps.activeSponsorCampaigns}</p>
            <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
              {a.revenueSponsors}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p
              className={`text-lg font-black ${
                revenueOps.expiringSponsorsSoon > 0 ? "text-amber-700" : "text-night"
              }`}
            >
              {revenueOps.expiringSponsorsSoon}
            </p>
            <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
              {a.revenueSponsorsExpiring}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p
              className={`text-lg font-black ${
                revenueOps.pendingBankTransfers > 0 ? "text-amber-700" : "text-night"
              }`}
            >
              {revenueOps.pendingBankTransfers}
            </p>
            <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
              {a.revenuePendingBank}
            </p>
          </div>
        </div>
        {revenueOps.sponsorsReconciled > 0 ? (
          <p className="mt-3 text-xs font-bold text-slate-500">
            {a.revenueSponsorsReconciled}: {revenueOps.sponsorsReconciled}
          </p>
        ) : null}
      </section>

      <AdminBillingGrantLedger grants={billingGrants} labels={a} />

      <section className="-mx-4 bg-white px-4 py-4">
        <h3 className="text-sm font-black text-night">{a.expansionTitle}</h3>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{a.expansionDesc}</p>
        <p
          className={`mt-3 text-sm font-black ${expansion.ready ? "text-emerald-700" : "text-amber-700"}`}
        >
          {expansion.ready ? a.expansionReady : a.expansionBlocked} · {expansion.readyCount}/
          {expansion.totalCount}
        </p>
        <ul className="mt-3 space-y-2">
          {expansion.signals.map((signal) => {
            const label =
              signal.id === "feedCoverage"
                ? `${a.expansionSignalCoverage}: ${formatCoveragePercent(expansion.feedCoverageRatio)} (≥ ${Math.round(LAUNCH_COVERAGE_TARGET * 100)}%)`
                : signal.id === "moderationSla"
                  ? `${a.expansionSignalSla}: ${
                      signal.ready
                        ? `≤ ${MODERATION_SLA_HOURS}h`
                        : `${expansion.moderationBreaches}`
                    }`
                  : expansion.learningCohortSize === 0
                    ? a.expansionNoD7Cohort
                    : `${a.expansionSignalD7}: ${formatRetentionPercent(expansion.learningRetentionRatio)} (≥ ${Math.round(LEARNING_RETENTION_TARGET * 100)}%)`;

            return (
              <li
                key={signal.id}
                className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600"
              >
                <span className={signal.ready ? "text-emerald-600" : "text-amber-600"}>
                  {signal.ready ? "✓" : "!"}
                </span>
                <span>{label}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <h3 className="text-sm font-black text-night">{a.quickLinksTitle}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-night" href="/moderation">
            {a.linkModeration}
          </Link>
          <Link className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-night" href="/setup">
            {a.linkSetup}
          </Link>
          <Link className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-night" href="/explore">
            {a.linkExplore}
          </Link>
        </div>
      </section>

      <AdminStripeCampaignPanel />

      <AdminUserSearch />

      <section className="-mx-4 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-lg font-black text-night">{a.densitySectionTitle}</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{a.densitySectionDesc}</p>
          {!serviceRoleReady ? (
            <p className="mt-2 text-xs font-bold leading-5 text-amber-700">{a.densityNeedsServiceRole}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <p className="w-full text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
              {a.densityFilterLabel}
            </p>
            <Link
              className={`rounded-lg px-3 py-2 text-xs font-black ${
                isPriorityFilter ? "bg-crystal text-white" : "bg-slate-100 text-night"
              }`}
              href="/admin"
            >
              {a.densityPriorityPreset}
            </Link>
            {EXAM_DENSITY_AGE_GROUPS.map((group) => {
              const active = densityFilterKey === group;
              return (
                <Link
                  className={`rounded-lg px-3 py-2 text-xs font-black ${
                    active ? "bg-crystal text-white" : "bg-slate-100 text-night"
                  }`}
                  href={`/admin?densityGroups=${group}`}
                  key={group}
                >
                  {group}
                </Link>
              );
            })}
          </div>
        </div>
        {densityReport.metrics.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-black text-night">{a.densityEmptyTitle}</p>
            <p className="mx-auto mt-1 max-w-64 text-sm font-bold leading-6 text-slate-500">
              {a.densityEmptyDesc}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">{a.densityColArea}</th>
                  <th className="px-4 py-3">{a.densityColTrack}</th>
                  <th className="px-4 py-3">{a.densityColPosts}</th>
                  <th className="px-4 py-3">{a.densityColCreators}</th>
                  <th className="px-4 py-3">{a.densityColSubscribers}</th>
                  <th className="px-4 py-3">{a.densityColStatus}</th>
                </tr>
              </thead>
              <tbody>
                {densityReport.metrics.map((row) => (
                  <tr className="border-b border-slate-100" key={row.areaId}>
                    <td className="px-4 py-3 font-black text-night">{row.areaName}</td>
                    <td className="px-4 py-3 font-bold text-slate-500">{row.ageGroup ?? "—"}</td>
                    <td className="px-4 py-3 font-bold text-slate-700">{row.postsInWindow}</td>
                    <td className="px-4 py-3 font-bold text-slate-700">{row.weeklyCreatorCount}</td>
                    <td className="px-4 py-3 font-bold text-slate-700">{row.subscriberCount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-lg px-2 py-1 text-[0.65rem] font-black ${densityBandClass(row.densityBand)}`}
                      >
                        {bandLabels[row.densityBand]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="-mx-4 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-lg font-black text-night">{a.bankTransferSectionTitle}</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{a.bankTransferSectionDesc}</p>
        </div>
        {bankTransfers.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-black text-night">{a.noBankTransfersTitle}</p>
            <p className="mx-auto mt-1 max-w-64 text-sm font-bold leading-6 text-slate-500">{a.noBankTransfersDesc}</p>
          </div>
        ) : (
          bankTransfers.map((transfer) => (
            <div className="space-y-3 border-b border-slate-100 px-4 py-4" key={transfer.id}>
              <div>
                <p className="font-black text-night">{transfer.user?.full_name ?? c.unknownUser}</p>
                <p className="text-xs font-bold text-slate-500">{transfer.user?.email}</p>
                <p className="mt-1 text-xs font-black text-crystal">{transfer.reference_code}</p>
              </div>
              <AdminBankTransferActions request={transfer} />
            </div>
          ))
        )}
      </section>

      <section className="-mx-4 bg-gradient-to-r from-violet-50 via-pink-50 to-cyan-50 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{a.auditEyebrow}</p>
            <h3 className="mt-1 text-xl font-black text-night">{a.auditTitle}</h3>
            <p className="mt-1 text-sm font-bold leading-6 text-slate-600">{a.auditDesc}</p>
          </div>
          <span className="rounded-lg bg-white px-3 py-2 text-xs font-black text-crystal">{c.live}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {auditItems.map((item) => (
            <div className="rounded-lg bg-white p-3" key={item.label}>
              <p className="text-lg font-black text-night">{item.value}</p>
              <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="-mx-4 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-lg font-black text-night">{a.studentDocSectionTitle}</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{a.studentDocSectionDesc}</p>
        </div>
        {studentDocuments.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-black text-night">{a.noStudentDocsTitle}</p>
            <p className="mx-auto mt-1 max-w-64 text-sm font-bold leading-6 text-slate-500">{a.noStudentDocsDesc}</p>
          </div>
        ) : (
          studentDocuments.map((student) => (
            <div className="border-b border-slate-100 px-4 py-4" key={student.id}>
              <AdminStudentDocumentActions
                documentUrl={student.student_document_url}
                fullName={student.full_name}
                gradeLevel={student.grade_level}
                studentId={student.id}
              />
            </div>
          ))
        )}
      </section>

      <section className="-mx-4 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-lg font-black text-night">Onay Bekleyen Kullanıcılar</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">Doğrulama bekleyen yeni hesaplar</p>
        </div>
        {pendingUsers.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-black text-night">Bekleyen onay yok</p>
            <p className="mx-auto mt-1 max-w-64 text-sm font-bold leading-6 text-slate-500">Tüm kullanıcılar onaylanmış.</p>
          </div>
        ) : (
          pendingUsers.map((user) => (
            <UserRow
              areas={areas}
              key={user.id}
              labels={{ verified: a.verified, pendingVerification: a.pendingVerification }}
              user={user}
            />
          ))
        )}
      </section>

      {verifiedUsers.length > 0 ? (
        <section className="-mx-4 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-lg font-black text-night">Doğrulanmış Kullanıcılar</h3>
          </div>
          {verifiedUsers.map((user) => (
            <UserRow
              areas={areas}
              key={user.id}
              labels={{ verified: a.verified, pendingVerification: a.pendingVerification }}
              user={user}
            />
          ))}
        </section>
      ) : null}

      <section className="-mx-4 bg-white">
        <h3 className="border-b border-slate-100 px-4 py-3 text-lg font-black text-night">{a.storeOrdersTitle}</h3>
        {redemptions.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-black text-night">{a.noOrdersTitle}</p>
            <p className="mx-auto mt-1 max-w-64 text-sm font-bold leading-6 text-slate-500">{a.noOrdersDesc}</p>
          </div>
        ) : (
          redemptions.map((redemption) => (
            <div className="space-y-3 border-b border-slate-100 px-4 py-4" key={redemption.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-night">{redemption.product?.name ?? c.zigoProduct}</p>
                  <p className="text-xs font-bold text-slate-500">
                    {redemption.child?.display_name ??
                      redemption.user?.full_name ??
                      c.unknownUser}
                  </p>
                  {redemption.note ? (
                    <p className="mt-2 text-xs leading-5 text-slate-600">{redemption.note}</p>
                  ) : null}
                </div>
                <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-night">
                  {redemption.points_spent} Zigo
                </span>
              </div>
              <AdminRedemptionStatus redemptionId={redemption.id} status={redemption.status} />
            </div>
          ))
        )}
      </section>

      <section className="-mx-4 bg-white">
        <h3 className="border-b border-slate-100 px-4 py-3 text-lg font-black text-night">{a.stockTitle}</h3>
        {products.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-black text-night">{a.noProductsTitle}</p>
            <p className="mx-auto mt-1 max-w-64 text-sm font-bold leading-6 text-slate-500">{a.noProductsDesc}</p>
          </div>
        ) : (
          products.map((product) => (
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4" key={product.id}>
              <div>
                <p className="font-black text-night">{product.name}</p>
                <p className="text-xs font-bold text-slate-500">
                  {product.price_points} Zigo · {product.category}
                </p>
              </div>
              <AdminStockForm productId={product.id} stockCount={product.stock_count} />
            </div>
          ))
        )}
      </section>
    </div>
  );
}
