export default function QuestionsLoading() {
  return (
    <div className="space-y-3 pb-3">
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-3">
        <div className="skeleton-shimmer h-4 w-28 rounded-lg" />
      </section>
      {Array.from({ length: 5 }).map((_, i) => (
        <div className="rounded-2xl border border-slate-100 bg-white p-4" key={i}>
          <div className="mb-3 flex items-center gap-2">
            <div className="skeleton-shimmer size-8 rounded-full" />
            <div className="skeleton-shimmer h-3 w-24 rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="skeleton-shimmer h-3 w-full rounded-lg" />
            <div className="skeleton-shimmer h-3 w-3/4 rounded-lg" />
          </div>
          <div className="mt-3 flex gap-2">
            <div className="skeleton-shimmer h-6 w-16 rounded-full" />
            <div className="skeleton-shimmer h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
