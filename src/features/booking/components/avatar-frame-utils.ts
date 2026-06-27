import type { AvatarAssets } from "@/lib/supabase/database.types";

export type ParsedChildAvatarAssets = AvatarAssets & {
  achievement_live_lesson?: boolean;
};

export const AVATAR_FRAME_STYLES: Record<
  string,
  { accent: string; labelKey: "liveLessonStarBadge" }
> = {
  lesson_star: {
    accent: "from-amber-400 via-yellow-300 to-orange-500",
    labelKey: "liveLessonStarBadge",
  },
};

export function parseChildAvatarAssets(assets: AvatarAssets | null | undefined): ParsedChildAvatarAssets {
  const raw = (assets ?? {}) as ParsedChildAvatarAssets;
  return {
    hat: raw.hat ?? null,
    suit: raw.suit ?? null,
    pet: raw.pet ?? null,
    cape: raw.cape ?? null,
    frame: raw.frame ?? null,
    achievement_live_lesson: Boolean(raw.achievement_live_lesson),
  };
}

export function hasLiveLessonStarBadge(assets: AvatarAssets | null | undefined): boolean {
  const parsed = parseChildAvatarAssets(assets);
  return parsed.frame === "lesson_star" || Boolean(parsed.achievement_live_lesson);
}

export function getAvatarFrameAccent(frame: string | null | undefined): string {
  if (!frame) return "from-crystal to-fuchsia-500";
  return AVATAR_FRAME_STYLES[frame]?.accent ?? "from-crystal to-fuchsia-500";
}
