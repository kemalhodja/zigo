export default function OnboardingLoading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 py-8">
      <div className="skeleton-shimmer size-20 rounded-3xl" />
      <div className="w-full max-w-xs space-y-3">
        <div className="skeleton-shimmer h-5 w-48 rounded-lg mx-auto" />
        <div className="skeleton-shimmer h-3 w-64 rounded-lg mx-auto" />
      </div>
      <div className="w-full max-w-xs space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="skeleton-shimmer h-12 w-full rounded-xl" key={i} />
        ))}
      </div>
    </div>
  );
}
