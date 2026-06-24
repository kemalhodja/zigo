export default function ExploreLoading() {
  return (
    <div className="space-y-3 pb-3">
      <section className="sticky top-[3.45rem] z-10 -mx-4 border-b border-pink-100 bg-white/95 px-4 pb-3 pt-1 backdrop-blur">
        <div className="skeleton-shimmer h-10 rounded-lg" />
        <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
          {[0, 1, 2, 3].map((item) => (
            <div className="skeleton-shimmer h-8 w-20 shrink-0 rounded-lg" key={item} />
          ))}
        </div>
      </section>
      <section className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto bg-white px-4 py-3">
        {[0, 1, 2].map((item) => (
          <div className="skeleton-shimmer h-28 min-w-36 rounded-lg" key={item} />
        ))}
      </section>
      <section className="-mx-4 grid auto-rows-[8.35rem] grid-cols-3 gap-px bg-white">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
          <div className={`skeleton-shimmer ${item === 0 || item === 4 ? "row-span-2" : ""}`} key={item} />
        ))}
      </section>
    </div>
  );
}
