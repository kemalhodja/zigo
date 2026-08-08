export default function StoreLoading() {
  return (
    <div className="space-y-4 pb-3">
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="skeleton-shimmer h-4 w-24 rounded-lg" />
          <div className="skeleton-shimmer h-7 w-20 rounded-full" />
        </div>
      </section>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white" key={i}>
            <div className="skeleton-shimmer h-32 w-full" />
            <div className="space-y-2 p-3">
              <div className="skeleton-shimmer h-3 w-3/4 rounded-lg" />
              <div className="skeleton-shimmer h-3 w-1/2 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
