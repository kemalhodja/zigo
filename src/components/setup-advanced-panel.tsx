"use client";

import { type ReactNode,useState } from "react";

type SetupAdvancedPanelProps = {
  title: string;
  hint: string;
  openLabel: string;
  hideLabel: string;
  children: ReactNode;
};

export function SetupAdvancedPanel({
  title,
  hint,
  openLabel,
  hideLabel,
  children,
}: SetupAdvancedPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="-mx-4 border-t border-slate-100 bg-white px-4 py-4">
      <button
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">+</p>
          <h2 className="mt-1 text-lg font-black text-night">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{hint}</p>
        </div>
        <span className="shrink-0 rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
          {open ? hideLabel : openLabel}
        </span>
      </button>
      {open ? <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">{children}</div> : null}
    </section>
  );
}
