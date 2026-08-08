"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type ExploreSearchBarProps = {
  initialQuery?: string;
  placeholder?: string;
};

function sanitizeQuery(val?: string | null): string {
  if (!val) return "";
  const trimmed = val.trim();
  if (trimmed.toLowerCase() === "teachers" || trimmed.toLowerCase() === "teacher") {
    return "";
  }
  return trimmed;
}

export function ExploreSearchBar({
  initialQuery = "",
  placeholder = "Ders, öğretmen veya konu ara…",
}: ExploreSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => sanitizeQuery(initialQuery));

  useEffect(() => {
    const qParam = searchParams.get("q");
    setQuery(sanitizeQuery(qParam ?? initialQuery));
  }, [searchParams, initialQuery]);

  function handleClear() {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    const newUrl = params.toString() ? `/explore?${params.toString()}` : "/explore";
    router.push(newUrl);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const clean = sanitizeQuery(query);
    if (clean) {
      params.set("q", clean);
    } else {
      params.delete("q");
    }
    const newUrl = params.toString() ? `/explore?${params.toString()}` : "/explore";
    router.push(newUrl);
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <svg
        aria-hidden="true"
        className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-4-4" />
      </svg>
      <input
        type="text"
        className="block w-full rounded-lg bg-slate-100 pl-9 pr-9 py-2.5 text-sm font-bold text-night outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-slate-200"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={(e) => {
          const clean = sanitizeQuery(e.target.value);
          if (clean !== e.target.value) {
            setQuery(clean);
          } else if (clean) {
            e.target.select();
          }
        }}
        placeholder={placeholder}
      />
      {query ? (
        <button
          type="button"
          onClick={handleClear}
          className="tap-scale absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-200 text-xs font-black text-slate-600 hover:bg-slate-300 transition"
          aria-label="Aramayı Temizle"
          title="Temizle"
        >
          ✕
        </button>
      ) : null}
    </form>
  );
}
