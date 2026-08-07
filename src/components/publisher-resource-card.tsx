"use client";

import { VerifiedBadge } from "@/components/verified-badge";

type PublisherResource = {
  id: string;
  title: string;
  publisherName: string;
  category: string; // "Soru Bankası" | "Deneme Sınavı" | "Yaprak Test" | "Özet Fasikül"
  gradeLevel: string; // "YKS" | "LGS" | "11. Sınıf" vs.
  downloadCount: number;
  rating: number;
  pdfUrl?: string;
  isVerified?: boolean;
};

export function PublisherResourceCard({ resource }: { resource: PublisherResource }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md space-y-3">
      <div className="flex items-center justify-between">
        <span className="rounded-lg bg-violet-100 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-wider text-violet-700">
          📚 {resource.category}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-bold text-slate-600">
          🎯 {resource.gradeLevel}
        </span>
      </div>

      <div>
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-bold text-slate-500 truncate">{resource.publisherName}</p>
          {resource.isVerified ? <VerifiedBadge size="sm" /> : null}
        </div>
        <h4 className="mt-0.5 text-sm font-black text-night leading-snug">{resource.title}</h4>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
        <div className="flex items-center gap-3 text-slate-500 font-semibold">
          <span>📥 {resource.downloadCount.toLocaleString("tr-TR")} İndirme</span>
          <span>⭐ {resource.rating.toFixed(1)}</span>
        </div>
        <a
          href={resource.pdfUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="tap-scale inline-flex items-center gap-1 rounded-xl bg-crystal px-3 py-1.5 text-xs font-black text-white hover:bg-crystal-dark"
        >
          <span>📄</span>
          <span>Kaynağı İncele</span>
        </a>
      </div>
    </div>
  );
}
