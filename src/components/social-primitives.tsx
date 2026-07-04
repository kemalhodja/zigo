import type { ReactNode } from "react";

type SocialAvatarProps = {
  accent?: string;
  className?: string;
  imageUrl?: string | null;
  label: string;
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
  ring = true,
}: SocialAvatarProps) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${accent} ${ring ? "p-0.5" : ""} ${className}`}>
      <span className="flex size-full items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white text-[0.68rem] font-black text-night">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="size-full object-cover" src={imageUrl} />
        ) : (
          getInitials(label)
        )}
      </span>
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
