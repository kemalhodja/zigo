export default function Loading() {
  return (
    <div className="space-y-4 pb-3">
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="size-12 animate-pulse rounded-lg bg-slate-200 story-ring" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-28 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-2 w-40 animate-pulse rounded-lg bg-slate-200" />
          </div>
          <div className="size-9 animate-pulse rounded-lg bg-slate-200" />
        </div>
      </section>
      <section className="space-y-3">
        <div className="-mx-4 h-[28rem] animate-pulse border-y border-slate-100 bg-slate-200/50" />
        <div className="flex gap-3 px-1">
          <div className="size-9 animate-pulse rounded-lg bg-slate-200" />
          <div className="size-9 animate-pulse rounded-lg bg-slate-200" />
          <div className="size-9 animate-pulse rounded-lg bg-slate-200" />
          <div className="ml-auto size-9 animate-pulse rounded-lg bg-slate-200" />
        </div>
        <div className="h-3 w-32 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-3 w-full animate-pulse rounded-lg bg-slate-200" />
        <div className="h-3 w-2/3 animate-pulse rounded-lg bg-slate-200" />
      </section>
    </div>
  );
}
