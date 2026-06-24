import type { LiveGatesReport } from "@/lib/domain/live-gates";
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

  return (
    <section className="-mx-4 bg-white px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{panelTitle}</p>
          <h2 className="mt-1 text-xl font-black text-night">
            {report.envConfigured
              ? labels.gatesGreen
                  .replace("{ready}", String(report.readyCount))
                  .replace("{total}", String(report.totalCount))
              : labels.connectFirst}
          </h2>
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
        {report.gates.map((gate) => (
          <article className="px-3 py-3" key={gate.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-black text-night">{gate.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">{gate.detail}</p>
                {gate.hint ? <p className="mt-1 text-xs font-bold leading-5 text-crystal">{gate.hint}</p> : null}
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
        ))}
      </div>

      <p className="mt-3 text-xs font-bold text-slate-500">
        {labels.cliHint}{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-black text-night">npm run test:live</code>
        {" · "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-black text-night">npm run test:deploy</code>
        {" · "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-black text-night">npm run setup:verify</code>
      </p>
    </section>
  );
}
