import { StoryViewer, type StoryViewerItem } from "@/components/story-viewer";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { allowDemoContent } from "@/lib/domain/demo-env";
import { type ActiveStory,getActiveStories } from "@/lib/domain/social";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

const demoStories = [
  {
    id: "demo-story-1",
    creatorId: "demo-aylin",
    creator: "aylinmath",
    caption: "Today: fractions in 3 steps",
    color: "from-crystal via-fuchsia-500 to-rose-400",
    mediaUrl: null,
    scene: "math",
    verified: true,
    isVideo: false,
  },
  {
    id: "demo-story-2",
    creatorId: "demo-mert",
    creator: "sciencewithmert",
    caption: "Window experiment: plant light",
    color: "from-emerald-500 via-teal-500 to-cyan-500",
    mediaUrl: null,
    scene: "science",
    verified: true,
    isVideo: false,
  },
] satisfies StoryViewerItem[];

type StoriesPageProps = {
  searchParams: Promise<{ creatorId?: string }>;
};

export default async function StoriesPage({ searchParams }: StoriesPageProps) {
  const params = await searchParams;
  const stories = await getStories(params.creatorId);

  return <StoryViewer stories={stories} />;
}

async function getStories(creatorId?: string): Promise<StoryViewerItem[]> {
  const emptyStories: StoryViewerItem[] = [];
  if (!hasSupabaseEnv()) return allowDemoContent() ? demoStories : emptyStories;

  const m = await getServerMessages();
  return withSupabaseFallback(async () => {
    const supabase = await createClient();
    const stories = await getActiveStories(supabase);

    if (stories.length === 0) return emptyStories;
    const filteredStories = creatorId
      ? stories.filter((story) => story.author?.id === creatorId)
      : stories;

    return (filteredStories.length > 0 ? filteredStories : stories).map((story) =>
      toStoryItem(story, m.sparkViewer.newStory),
    );
  }, allowDemoContent() ? demoStories : emptyStories);
}

function toStoryItem(story: ActiveStory, newStoryLabel: string): StoryViewerItem {
  const creator = story.author?.full_name.toLowerCase().replaceAll(" ", "") ?? "zigocreator";

  return {
    id: story.id,
    creatorId: story.author?.id ?? null,
    creator,
    caption: story.caption ?? newStoryLabel,
    color: "from-crystal via-fuchsia-500 to-rose-400",
    mediaUrl: story.media_url,
    scene: "profile",
    verified: Boolean(story.author?.is_verified),
    isVideo: isVideoUrl(story.media_url),
  };
}

function isVideoUrl(url: string | null) {
  return Boolean(url && /\.(mp4|webm|mov)(\?.*)?$/i.test(url));
}
