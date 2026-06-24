import Link from "next/link";

import { getServerMessages } from "@/lib/i18n/server";

export async function ProfileHighlights() {
  const { profileHighlights: h } = await getServerMessages();
  const highlights = [
    { accent: "from-crystal to-berry", icon: "play", label: h.sparks, metric: h.sparksMetric, progress: 86, href: "/sparks" },
    { accent: "from-aqua to-mint", icon: "reel", label: h.micro, metric: h.microMetric, progress: 64, href: "/micro" },
    { accent: "from-sun to-peach", icon: "save", label: h.saved, metric: h.savedMetric, progress: 52, href: "/collections" },
    { accent: "from-berry to-peach", icon: "ask", label: h.qa, metric: h.qaMetric, progress: 74, href: "/questions" },
  ];

  return (
    <section className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto border-t border-slate-100 bg-white px-4 py-3">
      {highlights.map((highlight) => (
        <Link
          aria-label={`${highlight.label} highlight: ${highlight.metric}`}
          className="tap-scale min-w-16 text-center"
          href={highlight.href}
          key={highlight.label}
        >
          <span className={`mx-auto flex size-16 items-center justify-center rounded-full bg-gradient-to-br ${highlight.accent} p-0.5`}>
            <span className="flex size-full items-center justify-center rounded-full border-2 border-white bg-slate-50 text-night">
              <HighlightIcon name={highlight.icon} />
            </span>
          </span>
          <span className="mt-1.5 block zigo-fit-text text-xs font-semibold leading-tight text-slate-700">
            {highlight.label}
          </span>
          <span className="sr-only">
            {highlight.metric}
          </span>
          <span className="sr-only">
            <span
              aria-hidden="true"
              className={`block h-full rounded-full bg-gradient-to-r ${highlight.accent}`}
              style={{ width: `${highlight.progress}%` }}
            />
          </span>
        </Link>
      ))}
    </section>
  );
}

function HighlightIcon({ name }: { name: string }) {
  if (name === "play") {
    return (
      <svg aria-hidden="true" className="ml-0.5 size-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    );
  }

  if (name === "reel") {
    return (
      <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect height="16" rx="4" width="18" x="3" y="4" />
        <path d="M11 12l4 2.5-4 2.5z" />
      </svg>
    );
  }

  if (name === "save") {
    return (
      <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M6 3h12v18l-6-4-6 4z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 12a8.5 8.5 0 0 1-9 8.5 9.6 9.6 0 0 1-4.2-.95L3 20.5l1.3-4A8.5 8.5 0 1 1 21 12z" />
      <path d="M9.5 9.5a2.5 2.5 0 0 1 4.2 1.8c0 1.9-1.7 2.3-1.7 3.7" />
      <path d="M12 18h.01" />
    </svg>
  );
}
