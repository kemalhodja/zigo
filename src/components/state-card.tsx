type StateCardProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
};

const defaultFooter = null;

export async function StateCard({ title, description, action, footer = defaultFooter }: StateCardProps) {
  return (
    <div className="-mx-4 bg-white px-6 py-12 text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-white text-night shadow-sm ring-1 ring-slate-200">
        <svg aria-hidden="true" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M4 4h16v16H4z" />
          <path d="M8 12h8" />
          <path d="M12 8v8" />
        </svg>
      </span>
      <h2 className="mt-4 text-xl font-black text-night">{title}</h2>
      <p className="mx-auto mt-2 max-w-72 text-sm leading-6 text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
      {footer}
    </div>
  );
}
