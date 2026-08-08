export default function LearnLoading() {
  return (
    <div className="space-y-4 pb-3">
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-3">
        <div className="skeleton-shimmer h-4 w-32 rounded-lg" />
      </section>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="skeleton-shimmer h-28 rounded-2xl" key={i} />
        ))}
      </div>
    </div>
  );
}
