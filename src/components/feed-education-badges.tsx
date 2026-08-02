import Link from "next/link";

import { canAccessStudentLearning } from "@/lib/domain/role-navigation";
import type { Messages } from "@/lib/i18n/server";
import type { UserRole } from "@/lib/supabase/database.types";

type FeedEducationBadgesProps = {
  area: string;
  badge: string;
  copy: Messages["feedEnhancements"];
  isMicro: boolean;
  postId?: string;
  viewerRole?: UserRole | "guest" | null;
};

export function FeedEducationBadges({
  area,
  badge,
  copy,
  isMicro,
  postId,
  viewerRole = null,
}: FeedEducationBadgesProps) {
  const askHref = postId ? `/questions?from=post&post=${postId}` : "/questions";
  const showQuiz = canAccessStudentLearning(viewerRole);
  const showAsk = viewerRole === "student" || viewerRole === "parent" || viewerRole === "teacher" || !viewerRole;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isMicro ? (
        <span className="zigo-meta-badge rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{badge}</span>
      ) : showQuiz ? (
        <span className="zigo-meta-badge rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">{copy.pointsReward}</span>
      ) : (
        <span className="zigo-meta-badge rounded-full bg-violet-50 px-2.5 py-1 text-crystal">{area}</span>
      )}
      {showQuiz ? (
        <Link className="zigo-meta-badge tap-scale rounded-full bg-cyan-50 px-2.5 py-1 text-teal-700" href="/learn">
          {copy.miniQuiz}
        </Link>
      ) : null}
      {showAsk ? (
        <Link className="zigo-meta-badge tap-scale rounded-full bg-pink-50 px-2.5 py-1 text-berry" href={askHref}>
          {copy.askAboutTopic}
        </Link>
      ) : null}
    </div>
  );
}
