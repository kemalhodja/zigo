export default function DuelsLoading() {
  return (
    <div className="space-y-4 pb-3">
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-3">
        <div className="skeleton-shimmer h-4 w-24 rounded-lg" />
      </section>
      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <div className="skeleton-shimmer mb-3 h-3 w-28 rounded-lg" />
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 flex-col items-center gap-2">
            <div className="skeleton-shimmer size-14 rounded-full" />
            <div className="skeleton-shimmer h-3 w-16 rounded-lg" />
          </div>
          <div className="skeleton-shimmer h-8 w-8 rounded-lg" />
          <div className="flex flex-1 flex-col items-center gap-2">
            <div className="skeleton-shimmer size-14 rounded-full" />
            <div className="skeleton-shimmer h-3 w-16 rounded-lg" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="skeleton-shimmer h-16 rounded-xl" key={i} />
        ))}
      </div>
    </div>
  );
}
