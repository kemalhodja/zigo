"use client";

import { branchAccentForArea, uniqueBranches } from "@/lib/domain/teacher-badges";

type TeacherTrustBadgesProps = {
  branches?: string[];
  maxVisible?: number;
  moreLabel?: string;
  showVerified?: boolean;
  size?: "md" | "sm";
  verified?: boolean;
  verifiedLabel?: string;
};

export function TeacherTrustBadges({
  branches = [],
  maxVisible = 3,
  moreLabel,
  size = "sm",
}: TeacherTrustBadgesProps) {
  const normalized = uniqueBranches(branches);
  const visible = normalized.slice(0, maxVisible);
  const hiddenCount = normalized.length - visible.length;

  if (visible.length === 0) return null;

  const textSize = size === "sm" ? "text-[0.62rem]" : "text-xs";
  const pad = size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1";

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {visible.map((branch) => (
          <span
            className={`inline-flex rounded-full ring-1 ring-inset ${pad} ${textSize} font-black ${branchAccentForArea(branch)}`}
            key={branch}
          >
            {branch}
          </span>
        ))}
        {hiddenCount > 0 ? (
          <span className={`rounded-full bg-slate-100 ${pad} ${textSize} font-black text-slate-600`}>
            {moreLabel?.replace("{count}", String(hiddenCount)) ?? `+${hiddenCount}`}
          </span>
        ) : null}
      </div>
    </>
  );
}
