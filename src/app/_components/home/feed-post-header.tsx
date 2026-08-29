import Link from "next/link";

import { FollowButton } from "@/components/follow-button";
import { PostOptionsButton } from "@/components/post-options-button";
import { SocialAvatar } from "@/components/social-primitives";

import type { DisplayPost } from "./data";

export function FeedPostHeader({
  post,
  postKey,
  theme = "dark",
}: {
  post: DisplayPost;
  postKey: string;
  teacherBadges?: { verifiedTeacher: string; moreAreas: string };
  theme?: "dark" | "light";
}) {
  const isDark = theme === "dark";
  const textColorClass = isDark ? "text-white shadow-black/20 text-shadow-sm" : "text-night";

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <Link className="flex min-w-0 flex-1 items-center gap-3" href={post.authorId ? `/profile/${post.authorId}` : "/profile"}>
        <SocialAvatar className="size-9" label={post.authorName} imageUrl={post.avatarUrl} />
          <div className="flex flex-col">
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
            {post.authorRole === "student" && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Zigo Plus Öğrenci
              </span>
            )}
            {post.isFollowersOnly && (
              <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-600">
                <svg aria-hidden="true" className="size-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-5.836 2l.778 7h6.116l.778-7H6.164z" clipRule="evenodd" />
                </svg>
                Sadece Takipçiler
              </span>
            )}
          </div>
      </Link>
      <div className="flex shrink-0 items-center gap-3">
        {!post.isOwner && post.authorId && (
          <div className="w-24">
            <FollowButton
              followingId={post.authorId}
              initialFollowing={post.isFollowingCreator}
              variant="compact"
            />
          </div>
        )}
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
