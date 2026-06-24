import Link from "next/link";

import type { Messages } from "@/lib/i18n/server";

type FeedEducationBadgesProps = {
  area: string;
  badge: string;
  copy: Messages["feedEnhancements"];
  isMicro: boolean;
  postId?: string;
};

export function FeedEducationBadges({ area, badge, copy, isMicro, postId }: FeedEducationBadgesProps) {
  const askHref = postId ? `/questions?from=post&post=${postId}` : "/questions";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="zigo-meta-badge rounded-full bg-violet-50 px-2.5 py-1 text-crystal">{area}</span>
      {isMicro ? (
        <>
          <span className="zigo-meta-badge rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
            {copy.oneMinLesson}
          </span>
          <span className="zigo-meta-badge rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
            {copy.pointsReward}
          </span>
        </>
      ) : (
        <span className="zigo-meta-badge rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{badge}</span>
      )}
      <Link className="zigo-meta-badge rounded-full bg-cyan-50 px-2.5 py-1 text-teal-700" href="/learn">
        {copy.miniQuiz}
      </Link>
      <Link className="zigo-meta-badge rounded-full bg-pink-50 px-2.5 py-1 text-berry" href={askHref}>
        {copy.askAboutTopic}
      </Link>
    </div>
  );
}
