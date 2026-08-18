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
}: {
  post: DisplayPost;
  postKey: string;
  teacherBadges: { verifiedTeacher: string; moreAreas: string };
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <Link className="flex min-w-0 flex-1 items-center gap-3" href={post.authorId ? `/profile/${post.authorId}` : "/profile"}>
        <SocialAvatar className="size-9" label={post.authorName} imageUrl={post.avatarUrl} online={post.verified} />
        <div className="min-w-0">
          <p className="truncate text-zigo-body font-bold text-night">
            {post.handle}
            {post.coAuthorName ? ` & ${post.coAuthorName.toLowerCase().replaceAll(" ", "")}` : ""}
          </p>
          {post.verified ? (
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <TeacherTrustBadges
                branches={post.area ? [post.area] : []}
                moreLabel={teacherBadges.moreAreas}
                showVerified
                verified={post.verified}
                verifiedLabel={teacherBadges.verifiedTeacher}
              />
              {post.locationName || post.city ? (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.62rem] font-bold text-slate-600 shadow-sm">
                  📍 {post.locationName || post.city}
                </span>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <p className="truncate text-zigo-meta font-semibold text-slate-500">{post.area}</p>
              {post.locationName || post.city ? (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.62rem] font-bold text-slate-600 shadow-sm">
                  📍 {post.locationName || post.city}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        {post.canFollowCreator && post.authorId && !post.isOwner ? (
          <FollowButton
            followingId={post.authorId}
            initialFollowing={post.isFollowingCreator}
            variant="compact"
          />
        ) : null}
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
