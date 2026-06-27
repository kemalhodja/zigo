import { branchAccentForArea, uniqueBranches } from "@/lib/domain/teacher-badges";

type TeacherTrustBadgesProps = {
  branches?: string[];
  maxVisible?: number;
  moreLabel?: string;
  showVerified?: boolean;
  showExpert?: boolean;
  size?: "md" | "sm";
  verified?: boolean;
  verifiedLabel?: string;
  expertLabel?: string;
};

export function TeacherTrustBadges({
  branches = [],
  maxVisible = 3,
  moreLabel,
  showVerified = true,
  showExpert = false,
  size = "sm",
  verified = false,
  verifiedLabel = "Onaylı Öğretmen",
  expertLabel = "Doğrulanmış Uzman",
}: TeacherTrustBadgesProps) {
  const normalized = uniqueBranches(branches);
  const visible = normalized.slice(0, maxVisible);
  const hiddenCount = normalized.length - visible.length;

  if (!verified && !showExpert && visible.length === 0) return null;

  const textSize = size === "sm" ? "text-[0.62rem]" : "text-xs";
  const pad = size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {showExpert ? (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 ${pad} ${textSize} font-black text-amber-950 shadow-sm`}
        >
          <svg aria-hidden="true" className="size-3 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6L12 2Z" />
          </svg>
          {expertLabel}
        </span>
      ) : null}
      {verified && showVerified ? (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-crystal to-indigo-500 ${pad} ${textSize} font-black text-white`}
        >
          <svg aria-hidden="true" className="size-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path d="m5 12 4 4L19 6" />
          </svg>
          {verifiedLabel}
        </span>
      ) : null}
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
  );
}
