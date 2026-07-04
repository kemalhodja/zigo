export default function ProfileLoading() {
  return (
    <div className="space-y-0 pb-3">
      <section className="-mx-4 bg-white px-4 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="skeleton-shimmer h-5 w-36 rounded-lg" />
          <div className="skeleton-shimmer size-9 rounded-lg" />
        </div>
        <div className="flex items-center gap-5">
          <div className="skeleton-shimmer story-ring size-[5.25rem] rounded-lg" />
          <div className="grid flex-1 grid-cols-3 gap-2">
            {[0, 1, 2].map((item) => (
              <div className="space-y-2 px-1 py-2" key={item}>
                <div className="skeleton-shimmer mx-auto h-4 w-10 rounded-lg" />
                <div className="skeleton-shimmer mx-auto h-2 w-14 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="skeleton-shimmer h-4 w-32 rounded-lg" />
          <div className="skeleton-shimmer h-3 w-full rounded-lg" />
          <div className="skeleton-shimmer h-3 w-2/3 rounded-lg" />
        </div>
      </section>
      <section className="-mx-4 mt-2 grid grid-cols-3 border-y border-pink-100 bg-white">
        {[0, 1, 2].map((item) => (
          <div className="px-3 py-3" key={item}>
            <div className="skeleton-shimmer mx-auto size-5 rounded-lg" />
          </div>
        ))}
      </section>
      <section className="-mx-4 grid grid-cols-3 gap-0.5 bg-white">
        {Array.from({ length: 9 }).map((_, index) => (
          <div className="skeleton-shimmer aspect-square" key={index} />
        ))}
      </section>
    </div>
  );
}
