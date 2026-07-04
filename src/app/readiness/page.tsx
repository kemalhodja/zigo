import Link from "next/link";

import { HostedDeployCard } from "@/components/hosted-deploy-card";
import { LiveGatesPanel } from "@/components/live-gates-panel";
import { RoleQaPanel } from "@/components/role-qa-panel";
import { hasSupabaseEnv } from "@/lib/config";
import { getLiveGates, mapLiveGatesToChecklist } from "@/lib/domain/live-gates";
import { masterReleaseSequence, premiumSocialGates, zigoProductTarget } from "@/lib/domain/product-standard";
import { localizeLiveGates } from "@/lib/i18n/localize-live-gates";
import { getServerMessages, type Messages } from "@/lib/i18n/server";

const verificationCommands = [
  "npm run test:smoke",
  "npm run test:rls",
  "npm run test:live",
  "npm run test:deploy",
  "npm run test:mobile",
  "npm run audit:education",
  "npm run audit:platform",
  "npm run audit:launch",
  "npm run audit:consolidation",
  "npm run test:acceptance",
  "npm run test:journey",
  "npm run typecheck",
  "npm run build:safe",
];

function buildChecklist(m: Messages, live: ReturnType<typeof mapLiveGatesToChecklist>) {
  const r = m.ops.readiness;
  const readyFlags = [
    hasSupabaseEnv(),
    live.coreSchema,
    live.siteUrl,
    live.moderationAudit,
    live.rlsPolicies,
    live.storageBucket,
    true,
    live.registrationMatrix,
    live.mvpSeed,
    true,
    live.liveApiReady && live.coreSchema && live.registrationMatrix && live.mvpSeed,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
  ];

  return r.checklist.map((item, index) => ({
    group: r.checklistGroups[item.groupKey as keyof typeof r.checklistGroups],
    title: item.title,
    detail: item.detail,
    ready: readyFlags[index] ?? false,
  }));
}

export default async function ReadinessPage() {
  const m = await getServerMessages();
  const r = m.ops.readiness;
  const c = m.ops.common;
  const liveReportRaw = await getLiveGates();
  const liveReport = localizeLiveGates(liveReportRaw, m.ops.liveGates);
  const liveMapped = mapLiveGatesToChecklist(liveReportRaw);
  const checklist = buildChecklist(m, liveMapped);
  const readyCount = checklist.filter((item) => item.ready).length;
  const readinessPercent = Math.round((readyCount / checklist.length) * 100);
  const launchGates = [
    {
      title: r.gateRepoTitle,
      status: r.gateRepoStatus,
      detail: r.gateRepoDetail,
      command: "npm run test:smoke && npm run test:rls && npm run test:live && npm run test:deploy && npm run test:mobile && npm run typecheck && npm run build:safe",
    },
    {
      title: r.gateSupabaseTitle,
      status:
        liveReportRaw.readyCount === liveReportRaw.totalCount && liveReportRaw.totalCount > 0
          ? r.gateSupabaseGreen
          : hasSupabaseEnv()
            ? r.gateSupabasePartial
                .replace("{ready}", String(liveReportRaw.readyCount))
                .replace("{total}", String(liveReportRaw.totalCount))
            : r.gateSupabaseNeedEnv,
      detail: r.gateSupabaseDetail,
      command: "npm run test:live",
    },
    {
      title: r.gateDeployTitle,
      status: r.gateDeployStatus,
      detail: r.gateDeployDetail,
      command: "npm run test:deploy",
    },
    {
      title: r.gateMobileTitle,
      status: r.gateMobileStatus,
      detail: r.gateMobileDetail,
      command: "npm run test:mobile && npm run android:build:release",
    },
  ];

  return (
    <div className="space-y-4 pb-3">
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{r.eyebrow}</p>
            <h1 className="mt-1 text-2xl font-black leading-tight text-night">{zigoProductTarget.slogan}.</h1>
          </div>
          <span className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-black text-night">{readinessPercent}%</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-500">{zigoProductTarget.northStar}</p>
      </section>

      <section className="-mx-4 overflow-hidden border-b border-violet-100 bg-white">
        <div className="bg-gradient-to-br from-crystal via-berry to-aqua px-4 py-5 text-white">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/75">{r.qualityScore}</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-5xl font-black leading-none">{readinessPercent}%</h2>
              <p className="mt-2 text-sm font-bold text-white/80">{r.qualitySubtitle}</p>
            </div>
            <span className="rounded-lg bg-white px-3 py-2 text-xs font-black text-night">{r.superPolish}</span>
          </div>
        </div>
        <div className="grid gap-3 px-4 py-4">
          {r.qualityPillars.map((pillar) => (
            <article className="rounded-lg bg-slate-50 p-3" key={pillar.label}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-night">{pillar.label}</p>
                <span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-crystal">{pillar.score}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-lg bg-white">
                <span className="block h-full rounded-lg bg-gradient-to-r from-crystal via-berry to-aqua" style={{ width: `${pillar.score}%` }} />
              </div>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{pillar.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{r.productStandard}</p>
        <h2 className="mt-2 text-2xl font-black leading-tight text-night">{zigoProductTarget.promise}</h2>
        <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
          {premiumSocialGates.map((gate) => (
            <article className="min-w-64 rounded-lg bg-slate-50 p-4" key={gate.surface}>
              <p className="text-lg font-black text-night">{gate.surface}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{gate.standard}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{r.masterSequence}</p>
            <h2 className="mt-1 text-xl font-black text-night">{r.buildInOrder}</h2>
          </div>
          <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-night">
            {masterReleaseSequence.length} {c.steps}
          </span>
        </div>
        <div className="mt-4 grid gap-2">
          {masterReleaseSequence.map((item, index) => (
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2" key={item}>
              <span className="flex size-7 items-center justify-center rounded-lg bg-white text-xs font-black text-night">
                {index + 1}
              </span>
              <p className="text-sm font-black text-slate-700">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{r.launchGatesEyebrow}</p>
            <h2 className="mt-1 text-xl font-black text-night">{r.launchGatesTitle}</h2>
          </div>
          <span className="zigo-cta tap-scale rounded-lg px-3 py-1 text-xs font-black text-white">
            {launchGates.length} {c.gates}
          </span>
        </div>
        <div className="mt-4 grid gap-3">
          {launchGates.map((gate) => (
            <article className="rounded-lg border border-slate-100 bg-slate-50 p-4" key={gate.title}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-night">{gate.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{gate.detail}</p>
                </div>
                <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-[0.68rem] font-black text-night">
                  {gate.status}
                </span>
              </div>
              <code className="mt-3 block overflow-x-auto rounded-lg bg-white px-3 py-2 text-[0.68rem] font-black text-slate-600">
                {gate.command}
              </code>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        {r.platformPillars.map((pillar) => (
          <article className="-mx-4 border-b border-slate-100 bg-white px-4 py-4" key={pillar.title}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-night">{pillar.title}</h2>
                <p className="mt-1 text-xs font-black text-slate-500">{pillar.status}</p>
              </div>
              <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-night">
                {pillar.items.length}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {pillar.items.map((item) => (
                <span className="rounded-lg bg-slate-100 px-3 py-1 text-[0.68rem] font-black text-slate-600" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{r.liveMvpEyebrow}</p>
            <h2 className="mt-1 text-xl font-black text-night">{r.liveMvpTitle}</h2>
          </div>
          <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-night">
            {r.liveSmokePath.length} {c.checks}
          </span>
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {r.liveSmokePath.map((step, index) => (
            <div className="flex gap-3 py-3" key={step}>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-night">
                {index + 1}
              </span>
              <p className="text-sm font-semibold leading-6 text-slate-600">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{r.verifyCommandsEyebrow}</p>
        <h2 className="mt-1 text-xl font-black text-night">{r.verifyCommandsTitle}</h2>
        <div className="mt-4 grid gap-2">
          {verificationCommands.map((command) => (
            <code className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white" key={command}>
              {command}
            </code>
          ))}
        </div>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{r.liveSupabaseEyebrow}</p>
        <h2 className="mt-1 text-xl font-black text-night">{r.liveSupabaseTitle}</h2>
        <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-100">
          {r.liveSupabaseGate.map((item, index) => (
            <div className="flex gap-3 px-3 py-3" key={item}>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-night">
                {index + 1}
              </span>
              <p className="text-sm font-bold leading-6 text-slate-600">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <LiveGatesPanel common={c} labels={m.ops.liveGates} report={liveReport} />

      <HostedDeployCard />

      <RoleQaPanel />

      <section className="space-y-3">
        {checklist.map((item) => (
          <article className="-mx-4 border-b border-slate-100 bg-white px-4 py-4" key={item.title}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-slate-400">{item.group}</p>
                <h2 className="text-lg font-black text-night">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">{item.detail}</p>
              </div>
              <span
                className={`rounded-lg px-3 py-1 text-xs font-black ${
                  item.ready ? "bg-mint text-night" : "bg-amber-100 text-amber-700"
                }`}
              >
                {item.ready ? c.ready : c.check}
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link className="rounded-lg bg-white p-4 text-center" href="/profiles">
          <p className="text-lg font-black text-night">{r.footerProfiles}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{r.footerProfilesSub}</p>
        </Link>
        <Link className="rounded-lg bg-white p-4 text-center" href="/moderation">
          <p className="text-lg font-black text-night">{r.footerSafety}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{r.footerSafetySub}</p>
        </Link>
        <Link className="rounded-lg bg-white p-4 text-center" href="/setup">
          <p className="text-lg font-black text-night">{r.footerSetup}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{r.footerSetupSub}</p>
        </Link>
      </section>
    </div>
  );
}
