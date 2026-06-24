export default function Loading() {
  return (
    <div className="space-y-4 pb-3">
      <section className="-mx-4 border-b border-pink-100 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="skeleton-shimmer story-ring size-12 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton-shimmer h-3 w-28 rounded-lg" />
            <div className="skeleton-shimmer h-2 w-40 rounded-lg" />
          </div>
          <div className="skeleton-shimmer size-9 rounded-lg" />
        </div>
      </section>
      <section className="space-y-3">
        <div className="-mx-4 skeleton-shimmer h-[28rem] border-y border-pink-50" />
        <div className="flex gap-3 px-1">
          <div className="skeleton-shimmer size-9 rounded-lg" />
          <div className="skeleton-shimmer size-9 rounded-lg" />
          <div className="skeleton-shimmer size-9 rounded-lg" />
          <div className="skeleton-shimmer ml-auto size-9 rounded-lg" />
        </div>
        <div className="skeleton-shimmer h-3 w-32 rounded-lg" />
        <div className="skeleton-shimmer h-3 w-full rounded-lg" />
        <div className="skeleton-shimmer h-3 w-2/3 rounded-lg" />
      </section>
    </div>
  );
}
