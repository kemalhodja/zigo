export default function NotificationsLoading() {
  return (
    <div className="space-y-1 pb-3">
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-3">
        <div className="skeleton-shimmer h-4 w-28 rounded-lg" />
      </section>
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          className="flex items-start gap-3 border-b border-slate-50 bg-white px-4 py-3"
          key={i}
        >
          <div className="skeleton-shimmer size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2 pt-0.5">
            <div className="skeleton-shimmer h-3 w-full rounded-lg" />
            <div className="skeleton-shimmer h-2.5 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
