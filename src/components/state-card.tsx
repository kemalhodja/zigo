import type { ReactNode } from "react";

export type StateCardProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
};

export function StateCard({ title, description, icon, action, secondaryAction }: StateCardProps) {
  return (
    <div className="-mx-4 bg-white px-6 py-12 text-center" data-testid="state-card">
      <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-white text-night shadow-sm ring-1 ring-slate-200">
        {icon || (
          <svg aria-hidden="true" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )}
      </span>
      <h2 className="mt-4 text-xl font-black text-night">{title}</h2>
      <p className="mx-auto mt-2 max-w-[280px] text-sm leading-6 text-slate-500">{description}</p>
      {action || secondaryAction ? (
        <div className="mt-6 flex flex-col items-center gap-3">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
