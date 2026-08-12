import Image from "next/image";
import type { ReactNode } from "react";

type SocialAvatarProps = {
  accent?: string;
  className?: string;
  imageUrl?: string | null;
  label: string;
  online?: boolean;
  ring?: boolean;
};

type IconButtonProps = {
  "aria-label": string;
  children: ReactNode;
  className?: string;
  href?: string;
};

export function SocialAvatar({
  accent = "from-crystal to-fuchsia-500",
  className = "size-10",
  imageUrl,
  label,
  online = false,
  ring = true,
}: SocialAvatarProps) {
  return (
    <span className={`relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${accent} ${ring ? "p-0.5" : ""} ${className}`}>
      <span className="relative flex size-full items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white text-[0.68rem] font-black text-night">
        {imageUrl ? (
          <Image alt={label} className="object-cover" fill sizes="48px" src={imageUrl} />
        ) : (
          getInitials(label)
        )}
      </span>
      {online ? (
        <span aria-hidden="true" className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-emerald-400">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
        </span>
      ) : null}
    </span>
  );
}

export function VerifiedBadge({ className = "size-3.5" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-full bg-crystal text-white ${className}`}>
      <svg aria-hidden="true" className="size-[70%]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
        <path d="m5 12 4 4L19 6" />
      </svg>
    </span>
  );
}

export function SocialPill({
  children,
  tone = "light",
}: {
  children: ReactNode;
  tone?: "dark" | "glass" | "light" | "primary";
}) {
  const toneClass =
    tone === "dark"
      ? "bg-crystal text-white"
      : tone === "glass"
        ? "border border-white/20 bg-black/20 text-white backdrop-blur"
        : tone === "primary"
          ? "bg-crystal text-white"
          : "bg-slate-100 text-night";

  return <span className={`inline-flex rounded-lg px-3 py-1 text-xs font-black ${toneClass}`}>{children}</span>;
}

export function SocialIconButton({ children, className = "", href, ...props }: IconButtonProps) {
  const classes = `tap-scale flex size-9 items-center justify-center rounded-lg bg-slate-100 text-night ${className}`;

  if (href) {
    return (
      <a className={classes} href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} type="button" {...props}>
      {children}
    </button>
  );
}

export function getInitials(label: string) {
  return label
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
