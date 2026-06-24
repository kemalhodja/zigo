"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useMessages } from "@/lib/i18n/locale-context";
import { ZIGO_PATHS } from "@/lib/zigo-vocabulary";

export function BottomNav({
  canCreateSocialPost = false,
  unreadCount = 0,
  teacherInboxCount = 0,
  variant = "default",
}: {
  canCreateSocialPost?: boolean;
  unreadCount?: number;
  teacherInboxCount?: number;
  variant?: "default" | "overlay";
}) {
  const pathname = usePathname();
  const t = useMessages().nav;

  const baseNavItems = [
    { href: "/", icon: "home", label: t.home, match: (path: string) => path === "/" },
    { href: "/explore", icon: "search", label: t.search, match: (path: string) => path.startsWith("/explore") },
    { href: "/create", icon: "create", label: t.create, match: (path: string) => path.startsWith("/create") },
    { href: ZIGO_PATHS.micro, icon: "micro", label: t.micro, match: (path: string) => path.startsWith(ZIGO_PATHS.micro) },
    { href: "/questions", icon: "ask", label: t.ask, match: (path: string) => path.startsWith("/questions") },
    { href: "/profile", icon: "profile", label: t.profile, match: (path: string) => path.startsWith("/profile") },
  ];

  const navItems = [
    baseNavItems[0],
    baseNavItems[1],
    canCreateSocialPost ? baseNavItems[2] : { ...baseNavItems[2], href: "/questions", label: t.ask },
    baseNavItems[3],
    baseNavItems[5],
  ];

  return (
    <nav
      className={`safe-bottom sticky bottom-0 grid grid-cols-5 px-1 pt-1 text-center zigo-nav-label ${
        variant === "overlay"
          ? "border-t border-white/10 bg-black/25 text-white backdrop-blur"
          : "zigo-bottom-bar text-slate-500"
      }`}
    >
      {navItems.map((item) => {
        const isActive = item.match(pathname);

        return (
          <Link
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={`tap-scale relative flex touch-manipulation flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition ${
              isActive
                ? variant === "overlay"
                  ? "bg-white/25 text-white shadow-sm"
                  : "bg-violet-50 text-crystal"
                : variant === "overlay"
                  ? "text-white/85 hover:text-white"
                  : "text-slate-500 hover:text-crystal"
            }`}
            href={item.href}
            key={item.href}
          >
            <span className={`flex size-9 items-center justify-center transition ${isActive ? "scale-105" : ""}`}>
              <NavIcon active={isActive} name={item.icon} variant={variant} />
            </span>
            <span className={`max-w-full px-0.5 text-center ${isActive ? "font-bold text-night" : "font-semibold"}`}>
              {item.label}
            </span>
            {item.href === "/profile" && (unreadCount > 0 || teacherInboxCount > 0) ? (
              <span className="zigo-badge-count absolute right-1 top-0 flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-white">
                {(unreadCount + teacherInboxCount) > 9 ? "9+" : unreadCount + teacherInboxCount}
              </span>
            ) : null}
            {isActive ? (
              <span
                className={`absolute bottom-0.5 h-1 w-5 rounded-full ${
                  variant === "overlay" ? "bg-white" : "bg-crystal"
                }`}
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function NavIcon({
  active,
  name,
  variant = "default",
}: {
  active: boolean;
  name: string;
  variant?: "default" | "overlay";
}) {
  const activeFill = variant === "overlay" ? "currentColor" : "#7C3AED";
  if (name === "home") {
    return (
      <svg aria-hidden="true" className="size-6" fill={active ? activeFill : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h14V10" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth={active ? "2.6" : "2"} viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-4-4" />
      </svg>
    );
  }

  if (name === "create") {
    return (
      <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth={active ? "2.6" : "2"} viewBox="0 0 24 24">
        <rect height="18" rx="5" width="18" x="3" y="3" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
      </svg>
    );
  }

  if (name === "ask") {
    return (
      <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth={active ? "2.6" : "2"} viewBox="0 0 24 24">
        <path d="M21 12a8.5 8.5 0 0 1-9 8.5 9.6 9.6 0 0 1-4.2-.95L3 20.5l1.3-4A8.5 8.5 0 1 1 21 12z" />
        <path d="M9.5 9.5a2.5 2.5 0 0 1 4.2 1.8c0 1.9-1.7 2.3-1.7 3.7" />
        <path d="M12 18h.01" />
      </svg>
    );
  }

  if (name === "micro") {
    return (
      <svg aria-hidden="true" className="size-6" fill={active ? activeFill : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect height="16" rx="4" width="18" x="3" y="4" />
        <path d="M8 4l3 5" />
        <path d="M14 4l3 5" />
        <path d="M11 12l4 2.5-4 2.5z" />
      </svg>
    );
  }

  return (
    <span className={`flex size-6 items-center justify-center rounded-full border-2 border-current p-0.5 ${active ? "bg-current" : ""}`}>
      <span className={`size-full rounded-full ${active ? "bg-white" : "bg-current"}`} />
    </span>
  );
}
