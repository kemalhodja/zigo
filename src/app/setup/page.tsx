import Link from "next/link";

import { HostedDeployCard } from "@/components/hosted-deploy-card";
import { LiveGatesPanel } from "@/components/live-gates-panel";
import { RoleQaPanel } from "@/components/role-qa-panel";
import { SetupAdvancedPanel } from "@/components/setup-advanced-panel";
import { SetupFirstTenMinutes } from "@/components/setup-first-ten-minutes";
import { SetupMigrationBundle } from "@/components/setup-migration-bundle";
import { SetupModeBanner } from "@/components/setup-mode-banner";
import { SetupProgressTracker } from "@/components/setup-progress-tracker";
import { SupabaseSetupCard } from "@/components/supabase-setup-card";
import { WhatsAppSupportCard } from "@/components/whatsapp-support-card";
import { hasSupabaseEnv } from "@/lib/config";
import { getLiveGates } from "@/lib/domain/live-gates";
import { MIGRATION_FILES } from "@/lib/domain/migration-target";
import { localizeLiveGates } from "@/lib/i18n/localize-live-gates";
import { getServerMessages } from "@/lib/i18n/server";

const verificationCommands = [
  "npm run test:smoke",
  "npm run test:migrations",
  "npm run test:rls",
  "npm run test:live",
  "npm run test:deploy",
  "npm run test:mobile",
  "npm run typecheck",
  "npm run build",
];

export default async function SetupPage() {
  const m = await getServerMessages();
  const s = m.ops.setupPage;
  const liveReportRaw = await getLiveGates();
  const liveReport = localizeLiveGates(liveReportRaw, m.ops.liveGates);

  return (
    <div className="space-y-5 pb-3">
      <SetupModeBanner labels={s.mode} />

      <SupabaseSetupCard envConnected={hasSupabaseEnv()} />

      <SetupProgressTracker common={m.ops.common} labels={m.ops.setupProgress} report={liveReportRaw} />

      <SetupMigrationBundle
        bundleCta={s.bundleCta}
        bundleHint={s.bundleHint}
        files={MIGRATION_FILES}
        quickstartLabel={s.quickstart}
        showAllLabel={s.showAllMigrations}
        title={s.migrationOrder}
      />

      <HostedDeployCard />

      <SetupFirstTenMinutes labels={s.firstTen} />

      <section className="-mx-4 bg-white px-4 py-4" id="demo-accounts">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-crystal">{s.demoEyebrow}</p>
        <h2 className="mt-2 text-xl font-black text-night">{s.demoTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {s.demoDesc} <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-black">ZigoTest123!</code>
        </p>
        <div className="mt-4 grid gap-2 text-sm font-bold text-slate-600">
          <p>{s.demoTeacher1}</p>
          <p>{s.demoTeacher2}</p>
          <p>{s.demoParent}</p>
          <p>{s.demoStudent}</p>
        </div>
        <Link className="mt-4 inline-flex rounded-lg bg-night px-4 py-3 text-sm font-black text-white" href="/auth">
          {m.ops.setupProgress.ctaTryNow}
        </Link>
      </section>

      <RoleQaPanel />

      <WhatsAppSupportCard
        buttonLabel={m.support.button}
        context="setup"
        description={m.support.description}
        eyebrow={m.support.eyebrow}
        hoursLabel={m.support.hours}
        prefilledMessage={m.support.messageSetup}
        privacyNote={m.support.privacyNote}
        role={null}
        title={m.support.title}
      />

      <SetupAdvancedPanel
        hideLabel={s.advancedHide}
        hint={s.advancedHint}
        openLabel={s.advancedOpen}
        title={s.advancedTitle}
      >
        <LiveGatesPanel
          common={m.ops.common}
          labels={m.ops.liveGates}
          report={liveReport}
          title={m.ops.liveGates.liveProjectStatus}
        />

        <section>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{s.liveTestEyebrow}</p>
          <h3 className="mt-2 text-lg font-black text-night">{s.liveTestTitle}</h3>
          <div className="mt-3 divide-y divide-slate-100">
            {s.liveChecks.map((check, index) => (
              <div className="flex gap-3 py-3" key={check}>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-night">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold leading-6 text-slate-600">{check}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{s.releaseVerifyEyebrow}</p>
          <h3 className="mt-2 text-lg font-black text-night">{s.releaseVerifyTitle}</h3>
          <div className="mt-3 grid gap-2">
            {verificationCommands.map((command) => (
              <code className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white" key={command}>
                {command}
              </code>
            ))}
          </div>
        </section>

        <section>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-crystal">{s.androidEyebrow}</p>
          <h3 className="mt-2 text-lg font-black text-night">{s.androidTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{s.androidDesc}</p>
          <a
            className="mt-3 inline-flex rounded-lg bg-gradient-to-r from-crystal to-berry px-4 py-3 text-sm font-black text-white"
            href="/mobile-apk-checklist.md"
          >
            {s.androidChecklist}
          </a>
        </section>

        <section>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-aqua">{s.pwaEyebrow}</p>
          <h3 className="mt-2 text-lg font-black text-night">{s.pwaTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{s.pwaDesc}</p>
        </section>

        <section>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-berry">{s.storageEyebrow}</p>
          <h3 className="mt-2 text-lg font-black text-night">{s.storageTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{s.storageDesc}</p>
        </section>

        <section>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-crystal">{s.qaEyebrow}</p>
          <h3 className="mt-2 text-lg font-black text-night">{s.qaTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{s.qaDesc}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a className="rounded-lg bg-gradient-to-r from-crystal to-berry px-4 py-3 text-center text-sm font-black text-white" href="/manual-qa-checklist.md">
              {s.manualQa}
            </a>
            <a className="rounded-lg bg-gradient-to-r from-aqua to-mint px-4 py-3 text-center text-sm font-black text-white" href="/visual-regression-checklist.md">
              {s.visualQa}
            </a>
            <a className="col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-black text-night" href="/safe-instagram-feel-checklist.md">
              {s.safeFeelChecklist}
            </a>
            <Link className="block zigo-cta tap-scale rounded-lg px-4 py-3 text-center text-sm font-black text-white" href="/readiness">
              {s.finalAcceptance}
            </Link>
            <Link className="block rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-black text-night" href="/social-polish-roadmap.md">
              {s.polishRoadmap}
            </Link>
          </div>
        </section>
      </SetupAdvancedPanel>
    </div>
  );
}

// /manual-qa-checklist.md
// /visual-regression-checklist.md
