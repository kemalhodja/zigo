"use client";

import { useMessages } from "@/lib/i18n/locale-context";

export function FeedTrustStrip() {
  const t = useMessages().feedEnhancements;

  const items = [t.trustVerified, t.trustModerated, t.trustNoDm, t.trustParentSafe];

  return (
    <section className="-mx-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 px-4 py-2.5">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {items.map((item) => (
          <span
            className="zigo-meta-badge shrink-0 rounded-full border border-emerald-200 bg-white/90 px-2.5 py-1 text-emerald-800"
            key={item}
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
