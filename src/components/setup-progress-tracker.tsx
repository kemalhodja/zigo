import Link from "next/link";

import type { LiveGatesReport } from "@/lib/domain/live-gates";
import { buildSetupProgress, summarizeSetupProgress } from "@/lib/domain/setup-progress";
import type { Messages } from "@/lib/i18n/server";

type SetupProgressTrackerProps = {
  labels: Messages["ops"]["setupProgress"];
  common: Messages["ops"]["common"];
  report: LiveGatesReport;
};

export function SetupProgressTracker({ common, labels, report }: SetupProgressTrackerProps) {
  const steps = buildSetupProgress(report, labels);
  const summary = summarizeSetupProgress(steps);
  const nextStep = steps.find((step) => !step.ready);

  return (
    <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{labels.eyebrow}</p>
          <h2 className="mt-1 text-xl font-black text-night">
            {summary.percent === 100
              ? labels.complete
              : nextStep
                ? `${labels.nextPrefix} ${nextStep.title}`
                : labels.progress}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {labels.summary
              .replace("{ready}", String(summary.readyCount))
              .replace("{total}", String(summary.totalCount))}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-lg px-3 py-1 text-xs font-black ${
            summary.percent === 100 ? "bg-mint text-night" : summary.percent > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
          }`}
        >
          {summary.percent}%
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {steps.map((step, index) => (
          <article
            className={`rounded-lg border px-3 py-3 ${
              step.ready ? "border-mint/40 bg-mint/10" : step.id === nextStep?.id ? "border-crystal/30 bg-violet-50" : "border-slate-100 bg-slate-50"
            }`}
            id={step.id === "auth_redirect" ? "hosted-deploy" : undefined}
            key={step.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-slate-400">
                  {labels.stepLabel.replace("{n}", String(index + 1))}
                </p>
                <h3 className="text-sm font-black text-night">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">{step.detail}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {step.command ? (
                    <code className="rounded bg-slate-950 px-2 py-1 text-[0.68rem] font-black text-white">{step.command}</code>
                  ) : null}
                  {step.href ? (
                    <Link className="text-xs font-black text-crystal" href={step.href}>
                      {common.open}
                    </Link>
                  ) : null}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-lg px-2.5 py-1 text-[0.65rem] font-black ${
                  step.ready ? "bg-mint text-night" : "bg-white text-slate-600"
                }`}
              >
                {step.ready ? common.done : common.todo}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
