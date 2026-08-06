"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function NotificationItemLink({
  children,
  className,
  href,
}: {
  children: ReactNode;
  className?: string;
  href: string;
}) {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("zigo:unread-count-updated", { detail: { count: 0 } }));
      fetch("/api/social/notifications/read", { method: "POST" }).catch(() => null);
    }
  };

  return (
    <Link className={className} href={href} onClick={handleClick}>
      {children}
    </Link>
  );
}
