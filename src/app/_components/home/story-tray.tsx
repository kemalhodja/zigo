import Link from "next/link";

import { SocialAvatar } from "@/components/social-primitives";
import type { Messages } from "@/lib/i18n/server";

import type { DisplayStory } from "./data";

export function StoryTray({
  stories,
  feedExtras,
  feedEnhancements,
}: {
  stories: DisplayStory[];
  feedExtras: Messages["feedExtras"];
  feedEnhancements: Messages["feedEnhancements"];
}) {
  if (stories.length === 0) return null;

  return (
    <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-3 pt-1">
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-1">
        {stories.map((story) => (
          <StoryTrayItem feedExtras={feedExtras} feedEnhancements={feedEnhancements} key={story.id} story={story} />
        ))}
      </div>
    </section>
  );
}

function StoryTrayItem({
  story,
  feedExtras: f,
  feedEnhancements: fe,
}: {
  story: DisplayStory;
  feedExtras: Messages["feedExtras"];
  feedEnhancements: Messages["feedEnhancements"];
}) {
  const statusLabel =
    story.storyKind === "daily-mission"
      ? fe.dailyMission
      : story.status === "create"
        ? f.createStory
        : story.status === "unread"
          ? f.unreadStory
          : f.watchedStory;
  const isLiveRing = story.status === "unread" || story.storyKind === "daily-mission";
  const ringClass =
    story.storyKind === "daily-mission"
      ? "bg-white story-ring-spin story-ring-spin-mission"
      : story.status === "watched"
        ? "bg-slate-200"
        : story.status === "create"
          ? "bg-gradient-to-br from-crystal to-fuchsia-500"
          : "bg-white story-ring-spin story-ring-unread";

  return (
    <Link
      aria-label={`${statusLabel}: ${story.handle}`}
      className="tap-scale group min-w-16 text-center"
      href={story.href}
    >
      <span
        className={`relative mx-auto flex size-[4.7rem] items-center justify-center rounded-full p-[3px] ${
          isLiveRing ? "story-live-pulse" : ""
        } ${ringClass}`}
      >
        <SocialAvatar
          accent={story.status === "watched" ? "from-slate-200 to-slate-200" : story.accent}
          className="size-full"
          imageUrl={story.mediaUrl}
          label={story.name}
          ring={false}
        />
        {story.status === "create" ? (
          <span className="absolute bottom-0 right-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-crystal text-sm font-black leading-none text-white">
            +
          </span>
        ) : story.showLiveBadge ? (
          <span className="zigo-badge-count absolute -right-0.5 top-0 rounded-full bg-rose-500 px-1.5 py-0.5 text-white">
            {fe.liveLesson}
          </span>
        ) : story.showNewBadge ? (
          <span className="zigo-badge-count absolute -right-0.5 top-0 rounded-full bg-crystal px-1.5 py-0.5 text-white">
            {fe.newLesson}
          </span>
        ) : story.storyKind === "daily-mission" ? (
          <span className="absolute inset-1 rounded-full border-2 border-white/80" style={{ clipPath: `inset(0 ${100 - story.progress}% 0 0)` }} />
        ) : (
          <span className="sr-only">{f.storyProgress.replace("{progress}", String(story.progress))}</span>
        )}
      </span>
      <span className="zigo-fit-text mt-2 block max-w-[4.5rem] text-center text-xs font-bold leading-tight text-slate-700">
        {story.storyKind === "daily-mission" ? fe.dailyMission : story.handle}
      </span>
      {story.missionMeta ? (
        <span className="zigo-fit-text block max-w-[4.5rem] text-center text-zigo-micro font-semibold text-crystal">{story.missionMeta}</span>
      ) : null}
    </Link>
  );
}
