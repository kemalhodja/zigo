"use client";

import type { ReactNode } from "react";

type CalendarAgendaViewProps = {
  empty?: ReactNode;
  children: ReactNode;
  label?: string;
};

export function CalendarAgendaView({ empty, children, label }: CalendarAgendaViewProps) {
  return (
    <div className="mt-3">
      {label ? (
        <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      ) : null}
      <div aria-label={label} className="zigo-calendar-agenda no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1 snap-x snap-mandatory">
        {children}
      </div>
    </div>
  );
}

type CalendarAgendaCardProps = {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
};

export function CalendarAgendaCard({ title, subtitle, badge, actions }: CalendarAgendaCardProps) {
  return (
    <article className="zigo-agenda-card zigo-mobile-card flex min-w-[12.5rem] max-w-[14rem] shrink-0 snap-start flex-col justify-between gap-3 rounded-2xl bg-slate-50 ring-1 ring-slate-200/80">
      <div className="min-w-0">
        <p className="text-base font-black leading-snug text-night">{title}</p>
        {subtitle ? <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p> : null}
        {badge ? <div className="mt-2">{badge}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </article>
  );
}

export function CalendarAgendaEmpty({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-base font-semibold text-slate-500">{children}</p>;
}
