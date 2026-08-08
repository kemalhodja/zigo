export default function AdminLoading() {
  return (
    <div className="space-y-4 pb-3">
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-3">
        <div className="skeleton-shimmer h-4 w-32 rounded-lg" />
      </section>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="skeleton-shimmer h-20 rounded-2xl" key={i} />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3" key={i}>
            <div className="skeleton-shimmer size-9 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="skeleton-shimmer h-3 w-32 rounded-lg" />
              <div className="skeleton-shimmer h-2.5 w-20 rounded-lg" />
            </div>
            <div className="skeleton-shimmer h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
