import Link from "next/link";

import type { LiveGatesReport } from "@/lib/domain/live-gates";
import { buildSetupProgress, getNextSetupStep, summarizeSetupProgress } from "@/lib/domain/setup-progress";
import type { Messages } from "@/lib/i18n/server";

type SetupProgressTrackerProps = {
  labels: Messages["ops"]["setupProgress"];
  common: Messages["ops"]["common"];
  report: LiveGatesReport;
};

export function SetupProgressTracker({ common, labels, report }: SetupProgressTrackerProps) {
  const steps = buildSetupProgress(report, labels);
  const summary = summarizeSetupProgress(steps);
  const nextStep = getNextSetupStep(steps);
  const complete = summary.percent === 100;

  return (
    <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{labels.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-black text-night">
            {complete ? labels.complete : nextStep ? `${labels.nextPrefix} ${nextStep.title}` : labels.progress}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {labels.summary.replace("{ready}", String(summary.readyCount)).replace("{total}", String(summary.totalCount))}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-lg px-3 py-1 text-xs font-black ${
            complete ? "bg-mint text-night" : summary.percent > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
          }`}
        >
          {summary.percent}%
        </span>
      </div>

      {nextStep ? (
        <div className="mt-4 rounded-2xl border border-crystal/25 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-4">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-crystal">{labels.focusLabel}</p>
          <h3 className="mt-1 text-lg font-black text-night">{nextStep.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{nextStep.detail}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {nextStep.command ? (
              <code className="rounded-lg bg-slate-950 px-3 py-2 text-[0.72rem] font-black text-white">{nextStep.command}</code>
            ) : null}
            {nextStep.href ? (
              <Link
                className="tap-scale rounded-lg bg-gradient-to-r from-crystal to-berry px-4 py-2.5 text-sm font-black text-white"
                href={nextStep.href}
              >
                {nextStep.ctaLabel ?? common.open}
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-mint/40 bg-mint/15 p-4">
          <h3 className="text-lg font-black text-night">{labels.complete}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{labels.completeDetail}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link className="rounded-lg bg-night px-3 py-2.5 text-center text-sm font-black text-white" href="/auth">
              {labels.ctaTryNow}
            </Link>
            <Link className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-black text-night" href="/readiness">
              {labels.ctaReadiness}
            </Link>
          </div>
        </div>
      )}

      <ol className="mt-4 grid gap-2">
        {steps.map((step, index) => {
          const isNext = step.id === nextStep?.id;
          return (
            <li
              className={`flex items-start gap-3 rounded-xl border px-3 py-3 ${
                step.ready
                  ? "border-mint/35 bg-mint/10"
                  : isNext
                    ? "border-crystal/30 bg-violet-50/80"
                    : "border-slate-100 bg-slate-50"
              }`}
              id={step.id === "auth_redirect" ? "hosted-deploy" : step.id === "env" ? "env" : undefined}
              key={step.id}
            >
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                  step.ready ? "bg-mint text-night" : isNext ? "bg-crystal text-white" : "bg-white text-slate-500"
                }`}
              >
                {step.ready ? "✓" : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-black text-night">{step.title}</h3>
                  <span className={`shrink-0 text-[0.65rem] font-black ${step.ready ? "text-emerald-700" : "text-slate-500"}`}>
                    {step.ready ? common.done : common.todo}
                  </span>
                </div>
                {!step.ready && !isNext ? <p className="mt-1 text-xs leading-5 text-slate-500">{step.detail}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
