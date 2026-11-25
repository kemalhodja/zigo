"use client";

import { ArrowRight, Clock, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { CurriculumTopic } from "@/lib/domain/curriculum-topics";

export function TopicSearchBar({ topics }: { topics: CurriculumTopic[] }) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    if (!q) return [];
    return topics
      .filter(
        (t) =>
          t.title.toLocaleLowerCase("tr-TR").includes(q) ||
          t.subjectName.toLocaleLowerCase("tr-TR").includes(q) ||
          t.shortDesc.toLocaleLowerCase("tr-TR").includes(q),
      )
      .slice(0, 9);
  }, [query, topics]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Konu veya ders ara... (örn: Türev, Üslü, İnkılap, Optikler)"
          aria-label="Konu veya ders ara"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 text-sm font-semibold text-night placeholder:text-slate-400 outline-none focus:border-violet-400 focus:bg-white transition"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Aramayı temizle"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {query.trim() ? (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4 space-y-3">
          <p className="text-xs font-black text-violet-800">
            {matches.length > 0
              ? `"${query.trim()}" için ${matches.length} sonuç:`
              : `"${query.trim()}" ile eşleşen konu bulunamadı.`}
          </p>
          {matches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {matches.map((topic) => (
                <Link
                  key={`${topic.exam}-${topic.subjectSlug}-${topic.topicSlug}`}
                  href={`/konular/${topic.exam}/${topic.subjectSlug}/${topic.topicSlug}`}
                  className="rounded-xl border border-slate-200 bg-white p-3 hover:border-violet-300 transition flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-500">
                      <span className="text-violet-700">{topic.subjectName}</span>
                      <span className="inline-flex items-center gap-0.5">
                        <Clock className="size-3" />
                        {topic.studyMinutes} dk
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-black text-night">
                      {topic.title}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-violet-700">
                    <span>Aç</span>
                    <ArrowRight className="size-3" />
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
