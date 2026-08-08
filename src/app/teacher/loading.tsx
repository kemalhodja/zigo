export default function TeacherLoading() {
  return (
    <div className="space-y-4 pb-3">
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="skeleton-shimmer size-12 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton-shimmer h-3 w-28 rounded-lg" />
            <div className="skeleton-shimmer h-2.5 w-36 rounded-lg" />
          </div>
          <div className="skeleton-shimmer h-8 w-20 rounded-full" />
        </div>
      </section>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="skeleton-shimmer h-24 rounded-2xl" key={i} />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="skeleton-shimmer h-20 rounded-2xl" key={i} />
        ))}
      </div>
    </div>
  );
}
