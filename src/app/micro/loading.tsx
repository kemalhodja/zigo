export default function ReelsLoading() {
  return (
    <div className="-mx-4 -my-3 min-h-[calc(100dvh-7rem)] bg-night text-white">
      <section className="relative mx-auto min-h-[calc(100dvh-7rem)] max-w-md overflow-hidden">
        <div className="skeleton-shimmer absolute inset-0 bg-slate-800" />
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-center gap-1 px-5 pt-[calc(env(safe-area-inset-top)+0.8rem)]">
          <div className="skeleton-shimmer h-8 w-20 rounded-lg bg-white/20" />
          <div className="skeleton-shimmer h-8 w-24 rounded-lg bg-white/20" />
        </div>
        <div className="absolute left-5 right-5 top-[calc(env(safe-area-inset-top)+3.75rem)] z-10">
          <div className="h-1 overflow-hidden rounded-lg bg-white/20">
            <div className="h-full w-1/2 rounded-lg bg-gradient-to-r from-white via-mint to-aqua" />
          </div>
        </div>
        <div className="absolute bottom-8 left-5 right-20 z-10 space-y-3">
          <div className="skeleton-shimmer h-4 w-32 rounded-lg bg-white/20" />
          <div className="skeleton-shimmer h-3 w-full rounded-lg bg-white/20" />
          <div className="skeleton-shimmer h-3 w-2/3 rounded-lg bg-white/20" />
        </div>
        <div className="absolute bottom-12 right-4 z-10 space-y-3">
          {[0, 1, 2, 3].map((item) => (
            <div className="skeleton-shimmer size-11 rounded-lg bg-white/20" key={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
