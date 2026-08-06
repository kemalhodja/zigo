"use client";

import { useState, type ReactNode } from "react";

type StudioTabsLayoutProps = {
  analyticsNode: ReactNode;
  contentStudioNode: ReactNode;
  adsNode: ReactNode;
  requestsNode: ReactNode;
};

export function StudioTabsLayout({
  analyticsNode,
  contentStudioNode,
  adsNode,
  requestsNode,
}: StudioTabsLayoutProps) {
  const [activeTab, setActiveTab] = useState<"content" | "analytics" | "ads" | "requests">("content");

  return (
    <div className="space-y-4">
      {/* Studio Navigation Tabs */}
      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto border-b border-slate-200/80 bg-white px-4 py-2 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab("content")}
          className={`tap-scale flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition ${
            activeTab === "content"
              ? "bg-violet-600 text-white shadow-xs"
              : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
          }`}
        >
          <span>🎬</span>
          <span>İçerik Stüdyosu</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`tap-scale flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition ${
            activeTab === "analytics"
              ? "bg-violet-600 text-white shadow-xs"
              : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
          }`}
        >
          <span>📊</span>
          <span>Analiz & İstatistikler</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ads")}
          className={`tap-scale flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition ${
            activeTab === "ads"
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-xs"
              : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
          }`}
        >
          <span>📢</span>
          <span>Sponsorlu Reklamlar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`tap-scale flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition ${
            activeTab === "requests"
              ? "bg-violet-600 text-white shadow-xs"
              : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
          }`}
        >
          <span>💬</span>
          <span>Ders Talepleri & Soru-Cevap</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="animate-in fade-in duration-200">
        {activeTab === "content" ? contentStudioNode : null}
        {activeTab === "analytics" ? analyticsNode : null}
        {activeTab === "ads" ? adsNode : null}
        {activeTab === "requests" ? requestsNode : null}
      </div>
    </div>
  );
}
