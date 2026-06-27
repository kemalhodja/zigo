import Link from "next/link";
import type { ReactNode } from "react";

export type ShortcutScrollItem = {
  href: string;
  label: string;
  icon: ShortcutScrollIconName;
  primary?: boolean;
};

type ShortcutScrollIconName =
  | "hub"
  | "focus"
  | "learn"
  | "duels"
  | "family"
  | "requests"
  | "ask"
  | "spark"
  | "micro"
  | "studio"
  | "profile"
  | "store";

type ShortcutScrollDockProps = {
  items: ShortcutScrollItem[];
  title?: string;
  className?: string;
  roleClassName?: string;
};

export function ShortcutScrollDock({
  items,
  title,
  className = "",
  roleClassName = "",
}: ShortcutScrollDockProps) {
  return (
    <section
      className={`premium-action-dock relative mx-3 mb-2 overflow-hidden rounded-2xl border bg-white/95 p-2 backdrop-blur ${roleClassName} ${className}`}
    >
      {title ? (
        <p className="mb-2 px-1 text-[0.62rem] font-black uppercase tracking-[0.16em] text-slate-500">{title}</p>
      ) : null}
      <div
        aria-label={title}
        className="zigo-shortcut-scroll-track flex gap-2 overflow-x-auto overscroll-x-contain scroll-smooth pb-0.5"
        role="list"
      >
        {items.map((item) => (
          <Link
            aria-label={item.label}
            className={`tap-scale shortcut-scroll-item snap-start flex w-[4.75rem] shrink-0 flex-col items-center gap-1.5 rounded-2xl px-1 py-2 text-center transition ${
              item.primary
                ? "bg-gradient-to-br from-crystal to-fuchsia-500 text-white shadow-sm"
                : "bg-slate-50 text-night ring-1 ring-inset ring-slate-100"
            }`}
            href={item.href}
            key={`${item.href}-${item.label}`}
            role="listitem"
          >
            <span
              className={`flex size-10 items-center justify-center rounded-xl ${
                item.primary ? "bg-white/15" : "bg-white shadow-sm ring-1 ring-slate-100"
              }`}
            >
              <ShortcutScrollIcon name={item.icon} primary={item.primary} />
            </span>
            <span className="max-w-full truncate px-0.5 text-[0.62rem] font-black leading-tight">{item.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ShortcutScrollIcon({ name, primary }: { name: ShortcutScrollIconName; primary?: boolean }) {
  const stroke = primary ? "currentColor" : "#334155";
  const fill = primary ? "currentColor" : "none";

  const icons: Record<ShortcutScrollIconName, ReactNode> = {
    hub: (
      <svg aria-hidden="true" className="size-5" fill={fill} stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
    focus: (
      <svg aria-hidden="true" className="size-5" fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
    learn: (
      <svg aria-hidden="true" className="size-5" fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    duels: (
      <svg aria-hidden="true" className="size-5" fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <path d="M14.5 17.5 18 21l2-2-3.5-3.5" />
        <path d="m8 8 4 4" />
        <path d="m3 21 7.5-7.5L14 10l4-4 3 3-4 4-3.5 3.5L3 21z" />
      </svg>
    ),
    family: (
      <svg aria-hidden="true" className="size-5" fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="9" cy="7" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M3 20a6 6 0 0 1 12 0" />
        <path d="M14 20a4.5 4.5 0 0 1 9 0" />
      </svg>
    ),
    requests: (
      <svg aria-hidden="true" className="size-5" fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <rect height="16" rx="2" width="18" x="3" y="4" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
    ask: (
      <svg aria-hidden="true" className="size-5" fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 12a8.5 8.5 0 0 1-9 8.5 9.6 9.6 0 0 1-4.2-.95L3 20.5l1.3-4A8.5 8.5 0 1 1 21 12z" />
      </svg>
    ),
    spark: (
      <svg aria-hidden="true" className="size-5" fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
    micro: (
      <svg aria-hidden="true" className="size-5" fill={primary ? "currentColor" : "none"} stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <rect height="14" rx="3" width="10" x="7" y="5" />
        <path d="M11 5V3h2v2" />
      </svg>
    ),
    studio: (
      <svg aria-hidden="true" className="size-5" fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <rect height="7" width="7" x="3" y="3" />
        <rect height="7" width="7" x="14" y="3" />
        <rect height="7" width="7" x="14" y="14" />
        <rect height="7" width="7" x="3" y="14" />
      </svg>
    ),
    profile: (
      <svg aria-hidden="true" className="size-5" fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20a8 8 0 0 1 16 0" />
      </svg>
    ),
    store: (
      <svg aria-hidden="true" className="size-5" fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  };

  return icons[name];
}
