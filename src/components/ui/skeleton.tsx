"use client";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 ${className}`}
    />
  );
}

export function PostCardSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-2.5 w-1/4" />
        </div>
      </div>
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="rounded-3xl bg-slate-900 p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-full bg-slate-800" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-1/2 bg-slate-800" />
          <Skeleton className="h-3 w-1/3 bg-slate-800" />
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-xl bg-slate-800" />
    </div>
  );
}
