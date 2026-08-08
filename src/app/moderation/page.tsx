import Link from "next/link";

import { AdminAdApprovalQueue } from "@/components/admin-ad-approval-queue";
import { ModerationQueueItem } from "@/components/moderation-queue-item";
import { SocialPill } from "@/components/social-primitives";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { isCurrentUserPlatformAdmin } from "@/lib/domain/admin";
import { allowDemoContent } from "@/lib/domain/demo-env";
import {
  formatSlaAgeHours,
  getModerationSlaReport,
  isSlaBreached,
  MODERATION_SLA_HOURS,
  type ModerationSlaReport,
  sortModerationQueueBySla,
} from "@/lib/domain/moderation-sla";
import { getCurrentProfile } from "@/lib/domain/profiles";
import {
  getCreatorSafetyQueue,
  getModerationAdminAlerts,
  getUserContentReports,
  getUserSafetyQueue,
  type ModerationAdminAlert,
  type SafetyQueueItem,
  type UserContentReport,
} from "@/lib/domain/social";
import { getServerMessages } from "@/lib/i18n/server";
import type { Messages } from "@/lib/i18n/types";
import { createClient } from "@/lib/supabase/server";

const demoReports: DisplayReport[] = [
  {
    id: "demo-report-1",
    caption: "Fractions in 60 seconds",
    reason: "safety_review",
    status: "open",
    mediaType: "video",
    created_at: "2026-07-20T12:00:00.000Z",
  },
  {
    id: "demo-report-2",
    caption: "Comment preview before student display",
    reason: "bullying",
    status: "reviewing",
    mediaType: "image",
    created_at: "2026-07-23T10:00:00.000Z",
  },
];

const demoSafetyQueue: DisplaySafetyItem[] = [
  {
    id: "demo-safety-comment",
    kind: "comment",
    content: "Can you explain this step for younger students?",
    status: "pending",
    sourceTitle: "Fractions in 60 seconds",
    created_at: "2026-07-21T10:00:00.000Z",
  },
  {
    id: "demo-safety-reply",
    kind: "story reply",
    content: "I tried the experiment safely with my parent.",
    status: "pending",
    sourceTitle: "Window experiment story",
    created_at: "2026-07-23T11:00:00.000Z",
  },
];

function getSafetyLayers(mp: Messages["moderationPage"]) {
  return [
    mp.layerNoDm,
    mp.layerMatchFeed,
    mp.layerVerified,
    mp.layerTextMod,
    mp.layerObscenity,
    mp.layerReports,
    mp.layerParent,
  ];
}

type DisplayReport = {
  id: string;
  caption: string;
  reason: string;
  status: string;
  mediaType: string;
  created_at: string;
};

type DisplaySafetyItem = {
  id: string;
  kind: string;
  content: string;
  sourceTitle?: string;
  status: string;
  created_at: string;
};

type ModerationPageProps = {
  searchParams: Promise<{ queue?: string }>;
};

type ModerationFilter = "all" | "comments" | "reports" | "stories" | "breached";

export default async function ModerationPage({ searchParams }: ModerationPageProps) {
  const m = await getServerMessages();
  const mp = m.moderationPage;
  const params = await searchParams;
  const activeFilter = getModerationFilter(params.queue);
  const { reports, safetyQueue, adminAlerts, sla, isAdmin } = await getModerationData(m);
  const sortedSafety = sortModerationQueueBySla(safetyQueue);
  const openReports = sortModerationQueueBySla(
    reports.filter((report) => report.status !== "dismissed"),
  );
  const filteredSafetyQueue = filterSafetyQueue(sortedSafety, activeFilter);
  const breachedSafety = sortedSafety.filter((item) => isSlaBreached(item.created_at));
  const breachedReports = openReports.filter((report) => isSlaBreached(report.created_at));
  const breachedLaneCount = breachedSafety.length + breachedReports.length;
  const reviewCount =
    activeFilter === "reports"
      ? openReports.length
      : activeFilter === "breached"
        ? breachedLaneCount
        : filteredSafetyQueue.length;
  const safetyLayers = getSafetyLayers(mp);

  return (
    <div className="space-y-4 pb-3">
      <section className="-mx-4 border-b border-pink-100 bg-white px-4 pb-3">
        <h1 className="text-2xl font-black text-night">{mp.title}</h1>
        <p className="mt-1 text-xs font-bold text-slate-500">{mp.subtitle}</p>
      </section>

      {sla ? (
        <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{mp.slaEyebrow}</p>
          <h2 className="mt-1 text-lg font-black text-night">{mp.slaTitle}</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{mp.slaDesc}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <SlaStat label={mp.slaOpenReports} value={sla.openReports} />
            <SlaStat accent={!sla.onTarget && sla.breachedReports > 0} label={mp.slaBreachedReports} value={sla.breachedReports} />
            <SlaStat label={mp.slaPendingSafety} value={sla.pendingSafety} />
            <SlaStat accent={!sla.onTarget && sla.breachedSafety > 0} label={mp.slaBreachedSafety} value={sla.breachedSafety} />
            <SlaStat
              label={mp.slaMedianResolve}
              value={sla.medianResolveHours == null ? "—" : sla.medianResolveHours.toFixed(1)}
            />
            <div className="rounded-lg bg-slate-50 p-3">
              <p className={`text-sm font-black ${sla.onTarget ? "text-emerald-700" : "text-amber-700"}`}>
                {sla.onTarget ? mp.slaOnTarget : mp.slaBelowTarget}
              </p>
              <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">
                {mp.slaHoursLabel.replace("{hours}", String(MODERATION_SLA_HOURS))}
              </p>
            </div>
          </div>
        </section>
      ) : isAdmin === false ? (
        <section className="-mx-4 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-xs font-bold text-slate-500">{mp.slaAdminOnly}</p>
        </section>
      ) : null}

      <AdminAdApprovalQueue />

      <section className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto bg-white px-4 pb-3">
        {safetyLayers.map((layer) => (
          <span className="shrink-0 rounded-lg bg-gradient-to-r from-violet-50 to-pink-50 px-3 py-2 text-xs font-black text-crystal" key={layer}>
            {layer}
          </span>
        ))}
      </section>

      <section className="-mx-4 grid grid-cols-3 border-y border-pink-100 bg-white text-center text-xs font-semibold text-slate-600">
        <Stat accent="text-berry" label={mp.statReports} value={reports.length} />
        <Stat accent="text-crystal" label={mp.statOpen} value={reports.filter((report) => report.status === "open").length} />
        <Stat accent="text-aqua" label={mp.statPending} value={safetyQueue.length} />
      </section>

      <section className="-mx-4 no-scrollbar flex gap-2 overflow-x-auto bg-white px-4 py-3">
        <TriageLane active={activeFilter === "all"} href="/moderation" label={mp.filterAll} value={safetyQueue.length} />
        <TriageLane active={activeFilter === "comments"} href="/moderation?queue=comments" label={mp.filterComments} value={safetyQueue.filter((item) => item.kind === "comment").length} />
        <TriageLane active={activeFilter === "stories"} href="/moderation?queue=sparks" label={mp.filterSparks} value={safetyQueue.filter((item) => item.kind.includes("story")).length} />
        <TriageLane active={activeFilter === "reports"} href="/moderation?queue=reports" label={mp.filterReports} value={openReports.length} />
        <TriageLane
          active={activeFilter === "breached"}
          href="/moderation?queue=breached"
          label={mp.filterBreached}
          value={breachedLaneCount}
        />
      </section>

      {adminAlerts.length > 0 ? (
        <section className="-mx-4 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-lg font-black text-night">{mp.adminViolationAlerts}</h2>
            <SocialPill tone="primary">{adminAlerts.length}</SocialPill>
          </div>
          <div className="divide-y divide-slate-100 px-4">
            {adminAlerts.map((alert) => (
              <AdminViolationAlertCard alert={alert} key={alert.id} messages={m} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="-mx-4 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-lg font-black text-night">
            {activeFilter === "reports"
              ? mp.reportQueue
              : activeFilter === "breached"
                ? mp.breachedQueue
                : mp.reviewQueue}
          </h2>
          <SocialPill>{mp.pendingCount.replace("{count}", String(reviewCount))}</SocialPill>
        </div>
        <div className="divide-y divide-slate-100 px-4">
          {activeFilter === "reports" ? (
            openReports.length === 0 ? (
              <EmptyQueue messages={m} text={mp.noOpenReports} />
            ) : (
              openReports.map((report) => <ReportQueueCard key={report.id} messages={m} report={report} />)
            )
          ) : activeFilter === "breached" ? (
            breachedLaneCount === 0 ? (
              <EmptyQueue messages={m} text={mp.noBreachedItems} />
            ) : (
              <>
                {breachedReports.map((report) => (
                  <ReportQueueCard key={report.id} messages={m} report={report} />
                ))}
                {breachedSafety.map((item) => (
                  <ModerationQueueItem
                    ageLabel={formatSlaAgeHours(item.created_at)}
                    content={item.content}
                    id={item.id}
                    kind={item.kind}
                    key={item.id}
                    slaBreached
                    sourceTitle={item.sourceTitle}
                    status={item.status}
                  />
                ))}
              </>
            )
          ) : filteredSafetyQueue.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-black text-night">{mp.queueClear}</p>
              <p className="mx-auto mt-1 max-w-64 text-sm font-bold leading-6 text-slate-500">{mp.queueClearDesc}</p>
            </div>
          ) : (
            filteredSafetyQueue.map((item) => {
              const breached = isSlaBreached(item.created_at);
              return (
                <ModerationQueueItem
                  ageLabel={formatSlaAgeHours(item.created_at)}
                  content={item.content}
                  id={item.id}
                  kind={item.kind}
                  key={item.id}
                  slaBreached={breached}
                  sourceTitle={item.sourceTitle}
                  status={item.status}
                />
              );
            })
          )}
        </div>
      </section>

      <section className="-mx-4 bg-white">
        <h2 className="border-b border-slate-100 px-4 py-3 text-lg font-black text-night">{mp.reportHistory}</h2>
        {reports.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-black text-night">{mp.noReportsYet}</p>
            <p className="mx-auto mt-1 max-w-64 text-sm font-bold leading-6 text-slate-500">{mp.noReportsDesc}</p>
          </div>
        ) : (
          reports.map((report) => (
            <Link className="block border-b border-slate-100 px-4 py-4" href={`/moderation/reports/${report.id}`} key={report.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-crystal">
                    {report.reason.replaceAll("_", " ")}
                  </p>
                  <h2 className="mt-1 text-lg font-black text-night">{report.caption}</h2>
                  <p className="mt-1 text-xs font-bold text-slate-500">{report.mediaType}</p>
                </div>
                <SocialPill tone={report.status === "open" ? "primary" : "light"}>{report.status}</SocialPill>
              </div>
            </Link>
          ))
        )}
      </section>

      <Link className="tap-scale block rounded-lg bg-gradient-to-r from-crystal via-berry to-aqua px-4 py-3 text-center text-sm font-black text-white" href="/">
        {mp.backToFeed}
      </Link>
    </div>
  );
}

async function getModerationData(messages: Messages): Promise<{
  reports: DisplayReport[];
  safetyQueue: DisplaySafetyItem[];
  adminAlerts: ModerationAdminAlert[];
  sla: ModerationSlaReport | null;
  isAdmin: boolean | null;
}> {
  const emptyFallback = {
    reports: [] as DisplayReport[],
    safetyQueue: [] as DisplaySafetyItem[],
    adminAlerts: [] as ModerationAdminAlert[],
    sla: null as ModerationSlaReport | null,
    isAdmin: null as boolean | null,
  };

  if (!hasSupabaseEnv()) {
    return allowDemoContent()
      ? {
          reports: demoReports,
          safetyQueue: demoSafetyQueue,
          adminAlerts: [],
          sla: null,
          isAdmin: null,
        }
      : emptyFallback;
  }

  const previewFallback = allowDemoContent()
    ? {
        reports: demoReports,
        safetyQueue: demoSafetyQueue,
        adminAlerts: [] as ModerationAdminAlert[],
        sla: null as ModerationSlaReport | null,
        isAdmin: null as boolean | null,
      }
    : emptyFallback;

  return withSupabaseFallback(async () => {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) {
    return { reports: [], safetyQueue: [], adminAlerts: [], sla: null, isAdmin: false };
  }

  const isAdmin = await isCurrentUserPlatformAdmin(supabase);

  const [reports, ownSafetyQueue, creatorSafetyQueue, adminAlerts, sla] = await Promise.all([
    getUserContentReports(supabase, profile.id),
    getUserSafetyQueue(supabase, profile.id),
    getCreatorSafetyQueue(supabase, profile.id),
    isAdmin ? getModerationAdminAlerts(supabase) : Promise.resolve([]),
    isAdmin ? getModerationSlaReport(supabase) : Promise.resolve(null),
  ]);
  const safetyQueue = [...creatorSafetyQueue, ...ownSafetyQueue];

  return {
    reports: reports.map((report) => toDisplayReport(report, messages)),
    safetyQueue: safetyQueue.map(toDisplaySafetyItem),
    adminAlerts,
    sla,
    isAdmin,
  };
  }, previewFallback, emptyFallback);
}

function SlaStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className={`text-lg font-black ${accent ? "text-amber-700" : "text-night"}`}>{value}</p>
      <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
    </div>
  );
}

function toDisplayReport(report: UserContentReport, messages: Messages): DisplayReport {
  return {
    id: report.id,
    caption: report.post?.caption.slice(0, 80) ?? messages.moderationPage.reportedPost,
    reason: report.reason,
    status: report.status,
    mediaType: report.post?.media_type ?? "post",
    created_at: report.created_at,
  };
}

function toDisplaySafetyItem(item: SafetyQueueItem): DisplaySafetyItem {
  const sourceTitle = "sourceTitle" in item && typeof item.sourceTitle === "string" ? item.sourceTitle : undefined;

  return {
    id: item.id,
    kind: item.kind.replaceAll("_", " "),
    content: item.content,
    sourceTitle,
    status: item.moderation_status,
    created_at: item.created_at,
  };
}

function getModerationFilter(queue?: string): ModerationFilter {
  if (queue === "comments" || queue === "reports" || queue === "breached") return queue;
  if (queue === "stories" || queue === "sparks") return "stories";
  return "all";
}

function filterSafetyQueue(items: DisplaySafetyItem[], filter: ModerationFilter) {
  if (filter === "comments") return items.filter((item) => item.kind === "comment");
  if (filter === "stories") return items.filter((item) => item.kind.includes("story"));
  if (filter === "reports" || filter === "breached") return [];
  return items;
}

function EmptyQueue({ messages: m, text }: { messages: Messages; text: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm font-black text-night">{m.moderationPage.queueClear}</p>
      <p className="mx-auto mt-1 max-w-64 text-sm font-bold leading-6 text-slate-500">{text}</p>
    </div>
  );
}

function ReportQueueCard({ messages: m, report }: { messages: Messages; report: DisplayReport }) {
  const mp = m.moderationPage;
  const breached = isSlaBreached(report.created_at);
  const ageLabel = formatSlaAgeHours(report.created_at);
  return (
    <Link
      className={`block py-4 ${breached ? "rounded-lg bg-amber-50/70 px-2 -mx-2" : ""}`}
      href={`/moderation/reports/${report.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-berry">
            {report.reason.replaceAll("_", " ")}
          </p>
          <h3 className="mt-1 text-base font-black text-night">{report.caption}</h3>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {mp.reportStatus.replace("{status}", report.status)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {breached ? (
            <span className="rounded-lg bg-amber-200 px-2.5 py-1 text-[0.65rem] font-black text-amber-900">
              {mp.slaBreachBadge}
            </span>
          ) : null}
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[0.65rem] font-black text-slate-600">
            {mp.slaAgeLabel.replace("{age}", ageLabel)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function AdminViolationAlertCard({
  alert,
  messages: m,
}: {
  alert: ModerationAdminAlert;
  messages: Messages;
}) {
  const mp = m.moderationPage;
  const userName =
    alert.user && typeof alert.user === "object" && "full_name" in alert.user
      ? String(alert.user.full_name)
      : mp.unknownUser;

  return (
    <div className="py-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-berry">
        {alert.reason.replaceAll("_", " ")}
      </p>
      <h3 className="mt-1 text-base font-black text-night">{userName}</h3>
      <p className="mt-1 text-sm font-bold leading-6 text-slate-600">{alert.details}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{mp.alertStatus.replace("{status}", alert.status)}</p>
    </div>
  );
}

function Stat({ accent, label, value }: { accent: string; label: string; value: number }) {
  return (
    <div className="p-3 text-center">
      <p className={`text-xl font-black ${accent}`}>{value}</p>
      <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
    </div>
  );
}

function TriageLane({ active, href, label, value }: { active: boolean; href: string; label: string; value: number }) {
  return (
    <Link className={`min-w-[5.5rem] shrink-0 rounded-lg px-3 py-3 text-center ${active ? "bg-gradient-to-r from-crystal to-berry text-white" : "bg-slate-50 text-slate-700"}`} href={href}>
      <p className="text-lg font-black">{value}</p>
      <p className={`zigo-fit-text mt-1 text-[0.65rem] font-black uppercase tracking-[0.08em] ${active ? "text-white/75" : "text-slate-500"}`}>{label}</p>
    </Link>
  );
}
