export default function Loading() {
  return (
    <div className="space-y-0 pb-3">
      {/* Premium post skeleton */}
      {[0, 1].map((i) => (
        <article
          key={i}
          className="mb-3"
          style={{ opacity: i === 1 ? 0.55 : 1 }}
        >
          {/* Header */}
          <div className="-mx-4 flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3">
            <div className="size-9 skeleton-shimmer rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-28 skeleton-shimmer rounded-md" />
              <div className="h-2 w-20 skeleton-shimmer rounded-md" />
            </div>
            <div className="h-7 w-16 skeleton-shimmer rounded-lg" />
            <div className="size-7 skeleton-shimmer rounded-md" />
          </div>

          {/* Media */}
          <div className="-mx-4 aspect-[4/5] skeleton-shimmer" />

          {/* Actions */}
          <div className="-mx-4 flex items-center gap-3 bg-white px-4 pt-3 pb-1">
            <div className="size-8 skeleton-shimmer rounded-lg" />
            <div className="size-8 skeleton-shimmer rounded-lg" />
            <div className="size-8 skeleton-shimmer rounded-lg" />
            <div className="ml-auto size-8 skeleton-shimmer rounded-lg" />
          </div>

          {/* Caption */}
          <div className="-mx-4 space-y-2 bg-white px-4 pb-4 pt-2">
            <div className="h-2.5 w-3/4 skeleton-shimmer rounded-md" />
            <div className="h-2.5 w-1/2 skeleton-shimmer rounded-md" />
          </div>
        </article>
      ))}
    </div>
  );
}
