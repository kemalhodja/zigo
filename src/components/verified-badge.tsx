"use client";

type VerifiedBadgeProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function VerifiedBadge({ size = "md", className = "" }: VerifiedBadgeProps) {
  const sizeClass = size === "sm" ? "size-3.5" : size === "lg" ? "size-5" : "size-4";

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 text-sky-500 ${className}`}
      title="Doğrulanmış Profil"
    >
      <svg aria-hidden="true" className={sizeClass} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    </span>
  );
}
