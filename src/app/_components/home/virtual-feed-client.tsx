"use client";

import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

import type { Messages } from "@/lib/i18n/server";
import type { UserRole } from "@/lib/supabase/database.types";

import type { DisplayPost, DisplaySuggestedCreator } from "./data";
import { CreatorRail, FeedPostCard, FollowingStarter } from "./match-feed";

export function VirtualFeedClient({
  posts,
  suggestedCreators,
  messages,
  teacherBadges,
  viewerRole,
}: {
  posts: DisplayPost[];
  suggestedCreators: DisplaySuggestedCreator[];
  messages: Messages;
  teacherBadges: { verifiedTeacher: string; moreAreas: string };
  viewerRole?: UserRole | "guest" | null;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  const virtualizer = useWindowVirtualizer({
    count: posts.length,
    estimateSize: () => 700, // Estimated pixel height of a single FeedPostCard
    overscan: 4, // Keeps 4 posts in DOM out of view for smooth scrolling
  });

  if (posts.length === 0) {
    return <FollowingStarter creators={suggestedCreators} messages={messages} />;
  }

  return (
    <div
      ref={listRef}
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        width: "100%",
        position: "relative",
      }}
    >
      {virtualizer.getVirtualItems().map((virtualItem) => {
        const index = virtualItem.index;
        const post = posts[index];
        const isRailSlot = index === 3;

        return (
          <div
            key={post.postId ?? post.handle}
            data-index={index}
            ref={virtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <FeedPostCard
              enterDelayMs={Math.min(index, 4) * 45}
              feedEnhancements={messages.feedEnhancements}
              feedExtras={messages.feedExtras}
              post={post}
              priorityMedia={index === 0}
              teacherBadges={teacherBadges}
              viewerRole={viewerRole}
            />
            {isRailSlot ? (
              <CreatorRail
                creators={suggestedCreators}
                label={messages.feed.suggested}
                seeAll={messages.common.seeAll}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
