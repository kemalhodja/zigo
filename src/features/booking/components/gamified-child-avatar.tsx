import { SocialAvatar } from "@/components/social-primitives";
import {
  getAvatarFrameAccent,
  hasLiveLessonStarBadge,
  parseChildAvatarAssets,
} from "@/features/booking/components/avatar-frame-utils";
import type { AvatarAssets } from "@/lib/supabase/database.types";

type GamifiedChildAvatarProps = {
  avatarAssets?: AvatarAssets | null;
  badgeLabel?: string;
  className?: string;
  label: string;
  showBadgeLabel?: boolean;
  size?: "sm" | "md" | "lg";
};

const SIZE_CLASS = {
  sm: "size-12",
  md: "size-16",
  lg: "size-24",
} as const;

export function GamifiedChildAvatar({
  avatarAssets,
  badgeLabel,
  className = "",
  label,
  showBadgeLabel = false,
  size = "md",
}: GamifiedChildAvatarProps) {
  const parsed = parseChildAvatarAssets(avatarAssets);
  const hasStar = hasLiveLessonStarBadge(parsed);
  const accent = getAvatarFrameAccent(parsed.frame);

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <div className="relative inline-flex" data-testid={hasStar ? "gamified-child-avatar-star" : "gamified-child-avatar"}>
        <SocialAvatar accent={accent} className={SIZE_CLASS[size]} label={label} ring />
        {hasStar ? (
          <span
            aria-hidden="true"
            className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-amber-400 to-orange-500 text-xs shadow-sm"
            title={badgeLabel}
          >
            ⭐
          </span>
        ) : null}
      </div>
      {showBadgeLabel && hasStar && badgeLabel ? (
        <p className="max-w-24 text-center text-[0.62rem] font-black uppercase tracking-[0.08em] text-amber-600">
          {badgeLabel}
        </p>
      ) : null}
    </div>
  );
}
