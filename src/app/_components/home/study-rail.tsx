import Link from "next/link";

import { SocialMediaFrame } from "@/components/social-media-frame";
import type { Messages } from "@/lib/i18n/server";

import type { ReelSpotlightItem } from "./data";

export function ReelSpotlightRail({ messages, spotlights }: { messages: Messages; spotlights: ReelSpotlightItem[] }) {
  const f = messages.feed;

  return (
    <section className="-mx-4 px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-zigo-body font-bold text-night">{f.microToWatch}</p>
          <p className="mt-0.5 text-zigo-caption text-slate-600">{f.fastVerified}</p>
        </div>
        <Link className="text-zigo-caption font-bold text-crystal" href="/micro">
          {f.open}
        </Link>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        {spotlights.map((reel) => (
          <Link className="tap-scale min-w-28 overflow-hidden text-white" href={reel.href} key={`${reel.creator}-${reel.title}`}>
            <SocialMediaFrame
              alt={reel.title}
              className="h-44"
              gradient={reel.gradient}
              mediaType={reel.mediaType}
              mediaUrl={reel.mediaUrl}
              scene={reel.scene}
            >
              <div className="flex justify-end">
                <span className="flex size-8 items-center justify-center rounded-lg bg-black/25 backdrop-blur">
                  <svg aria-hidden="true" className="ml-0.5 size-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </div>
              <div>
                <p className="text-zigo-title-sm font-bold leading-tight">{reel.title}</p>
                <p className="mt-1 text-zigo-meta font-semibold text-white/80">@{reel.creator}</p>
              </div>
            </SocialMediaFrame>
          </Link>
        ))}
      </div>
    </section>
  );
}
