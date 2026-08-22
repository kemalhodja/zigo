import Link from "next/link";

import { FollowButton } from "@/components/follow-button";
import { PostOptionsButton } from "@/components/post-options-button";
import { SocialAvatar } from "@/components/social-primitives";
import { TeacherTrustBadges } from "@/components/teacher-trust-badges";

import type { DisplayPost } from "./data";

export function FeedPostHeader({
  post,
  postKey,
  teacherBadges,
  theme = "dark",
}: {
  post: DisplayPost;
  postKey: string;
  teacherBadges: { verifiedTeacher: string; moreAreas: string };
  theme?: "dark" | "light";
}) {
  const isDark = theme === "dark";
  const textColorClass = isDark ? "text-white shadow-black/20 text-shadow-sm" : "text-night";
  const subTextColorClass = isDark ? "text-white/80 shadow-black/20 text-shadow-sm" : "text-slate-600";
  const badgeBgClass = isDark ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700 border border-slate-200";

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <Link className="flex min-w-0 flex-1 items-center gap-3" href={post.authorId ? `/profile/${post.authorId}` : "/profile"}>
        <SocialAvatar className="size-9" label={post.authorName} imageUrl={post.avatarUrl} />
          <div className="flex items-center gap-1">
            <p className={`truncate text-[0.95rem] font-bold ${textColorClass}`}>
              {post.handle}
              {post.coAuthorName ? ` & ${post.coAuthorName.toLowerCase().replaceAll(" ", "")}` : ""}
            </p>
            {post.verified && (
              <svg aria-hidden="true" className="size-4 text-sky-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.1 14.8l-4.2-4.2 1.4-1.4 2.8 2.8 6.4-6.4 1.4 1.4-7.8 7.8z" />
              </svg>
            )}
          </div>
      </Link>
      <div className="flex shrink-0 items-center gap-3">
        <PostOptionsButton
          initialAreaId={post.areaId}
          initialCaption={post.caption}
          initialLocationName={post.locationName ?? undefined}
          initialSaved={post.isSaved}
          isOwner={post.isOwner}
          postId={post.postId}
          postKey={postKey}
        />
      </div>
    </div>
  );
}
