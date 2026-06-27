type VerifiedCredentialsBadgeProps = {
  approved?: boolean;
  className?: string;
};

export function VerifiedCredentialsBadge({ approved = false, className = "" }: VerifiedCredentialsBadgeProps) {
  if (!approved) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-2.5 py-0.5 text-[0.62rem] font-black uppercase tracking-wide text-white ${className}`}
    >
      <svg aria-hidden="true" className="size-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path d="m5 12 4 4L19 6" />
      </svg>
      Diploması Onaylı
    </span>
  );
}
