"use client";

import Link from "next/link";
import { useState } from "react";

import type { LiveGatesReport } from "@/lib/domain/live-gates";
import { resolveLiveGateFixHref } from "@/lib/domain/setup-first-ten";
import type { Messages } from "@/lib/i18n/server";

type LiveGatesPanelProps = {
  labels: Messages["ops"]["liveGates"];
  common: Messages["ops"]["common"];
  report: LiveGatesReport;
  title?: string;
};

export function LiveGatesPanel({ common, labels, report, title }: LiveGatesPanelProps) {
  const panelTitle = title ?? labels.defaultTitle;
  const percent = report.totalCount > 0 ? Math.round((report.readyCount / report.totalCount) * 100) : 0;
  const failing = report.gates.filter((gate) => !gate.ready);
  const passing = report.gates.filter((gate) => gate.ready);
  const [showPassing, setShowPassing] = useState(false);
  const visibleGates = showPassing ? report.gates : failing.length > 0 ? failing : report.gates;

  return (
    <section className="-mx-4 bg-white px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{panelTitle}</p>
          <h2 className="mt-1 text-xl font-black text-night">
            {report.envConfigured
              ? failing.length === 0
                ? labels.allGreen
                : labels.fixFocus.replace("{count}", String(failing.length))
              : labels.connectFirst}
          </h2>
          {report.envConfigured ? (
            <p className="mt-1 text-sm text-slate-500">
              {labels.gatesGreen
                .replace("{ready}", String(report.readyCount))
                .replace("{total}", String(report.totalCount))}
            </p>
          ) : null}
        </div>
        <span
          className={`rounded-lg px-3 py-1 text-xs font-black ${
            percent === 100 ? "bg-mint text-night" : percent > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
          }`}
        >
          {percent}%
        </span>
      </div>

      {!report.serviceRoleConfigured && report.envConfigured ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-800">
          {labels.serviceRoleHint}
        </p>
      ) : null}

      <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-100">
        {visibleGates.map((gate) => {
          const fixHref = !gate.ready ? resolveLiveGateFixHref(gate.id) : undefined;
          return (
            <article className={`px-3 py-3 ${gate.ready ? "" : "bg-amber-50/40"}`} key={gate.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-night">{gate.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{gate.detail}</p>
                  {!gate.ready && gate.hint ? (
                    <p className="mt-2 rounded-lg bg-white px-2.5 py-2 text-xs font-bold leading-5 text-amber-800">
                      {labels.fixPrefix} {gate.hint}
                    </p>
                  ) : null}
                  {fixHref ? (
                    <Link className="mt-2 inline-block text-xs font-black text-crystal" href={fixHref}>
                      {labels.fixCta}
                    </Link>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 rounded-lg px-2.5 py-1 text-[0.65rem] font-black ${
                    gate.ready ? "bg-mint text-night" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {gate.ready ? common.pass : common.check}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {passing.length > 0 && failing.length > 0 ? (
        <button
          className="mt-3 text-xs font-black text-crystal"
          onClick={() => setShowPassing((value) => !value)}
          type="button"
        >
          {showPassing ? labels.hidePassing : labels.showPassing.replace("{count}", String(passing.length))}
        </button>
      ) : null}

      <p className="mt-3 text-xs font-bold text-slate-500">
        {labels.cliHint}{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-black text-night">npm run test:live</code>
        {" · "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-black text-night">npm run setup:verify</code>
      </p>
    </section>
  );
}
