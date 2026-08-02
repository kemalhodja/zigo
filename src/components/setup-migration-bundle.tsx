"use client";

import { useState } from "react";

type SetupMigrationBundleProps = {
  title: string;
  bundleHint: string;
  bundleCta: string;
  showAllLabel: string;
  quickstartLabel: string;
  files: readonly string[];
};

export function SetupMigrationBundle({
  title,
  bundleHint,
  bundleCta,
  showAllLabel,
  quickstartLabel,
  files,
}: SetupMigrationBundleProps) {
  const [showAll, setShowAll] = useState(false);

  return (
    <section className="-mx-4 bg-white px-4 py-4" id="migrations">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{title}</p>
        <a className="text-xs font-black text-crystal" href="/supabase-quickstart.md">
          {quickstartLabel}
        </a>
      </div>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-black text-night">{bundleCta}</p>
        <code className="mt-2 block rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white">
          npm run migrations:bundle
        </code>
        <p className="mt-3 text-sm leading-6 text-slate-600">{bundleHint}</p>
      </div>
      <button
        className="mt-3 text-xs font-black text-crystal"
        onClick={() => setShowAll((value) => !value)}
        type="button"
      >
        {showAll ? "−" : "+"} {showAllLabel}
      </button>
      {showAll ? (
        <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto">
          {files.map((step, index) => (
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2" key={step}>
              <span className="flex size-7 items-center justify-center rounded-lg bg-white text-xs font-black text-night">
                {index + 1}
              </span>
              <p className="text-xs font-black text-slate-700">{step}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
