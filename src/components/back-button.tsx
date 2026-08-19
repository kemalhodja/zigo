"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  fallbackHref?: string;
  className?: string;
  label?: string;
};

export function BackButton({ fallbackHref = "/", className, label }: BackButtonProps) {
  const router = useRouter();
  const backLabel = label ?? "Geri";

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      aria-label={backLabel}
      className={
        className ??
        "tap-scale flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-slate-100 transition hover:bg-slate-800"
      }
      onClick={handleBack}
      title={backLabel}
      type="button"
    >
      <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
    </button>
  );
}
