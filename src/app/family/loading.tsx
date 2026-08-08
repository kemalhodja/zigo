export default function FamilyLoading() {
  return (
    <div className="space-y-4 pb-3">
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-4">
        <div className="skeleton-shimmer h-4 w-28 rounded-lg" />
      </section>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4" key={i}>
            <div className="skeleton-shimmer size-14 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="skeleton-shimmer h-3 w-32 rounded-lg" />
              <div className="skeleton-shimmer h-2.5 w-20 rounded-lg" />
            </div>
            <div className="skeleton-shimmer size-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
