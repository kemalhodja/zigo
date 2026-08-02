"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { resolveRoleNextAction } from "@/lib/domain/role-next-action";
import type { ViewerRole } from "@/lib/domain/role-theme";
import { useMessages } from "@/lib/i18n/locale-context";

type RoleNextActionBarProps = {
  canCreateSocialPost: boolean;
  viewerRole: ViewerRole;
};

/** Persistent one-job guidance — not a dismissible tip. */
export function RoleNextActionBar({ canCreateSocialPost, viewerRole }: RoleNextActionBarProps) {
  const pathname = usePathname();
  const m = useMessages();
  const rw = m.roleWelcome;

  if (pathname.startsWith("/auth") || pathname.startsWith("/create") || pathname === "/") {
    return null;
  }

  const action = resolveRoleNextAction(viewerRole, canCreateSocialPost, {
    student: { title: rw.studentTitle, hint: rw.studentHint, cta: rw.studentCta },
    parent: { title: rw.parentTitle, hint: rw.parentHint, cta: rw.parentCta },
    teacher: { title: rw.teacherTitle, hint: rw.teacherHint, cta: rw.teacherCta },
    teacherLocked: {
      title: rw.teacherLockedTitle,
      hint: rw.teacherLockedHint,
      cta: rw.teacherLockedCta,
    },
    guest: { title: rw.guestTitle, hint: rw.guestHint, cta: rw.guestCta },
  });

  const isActive = pathname === action.href || pathname.startsWith(`${action.href}/`);

  return (
    <section
      className="role-welcome-strip mb-3 rounded-2xl border px-4 py-3"
      data-testid="role-next-action"
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black leading-snug text-night">{action.title}</p>
          <p className="mt-0.5 text-xs font-semibold leading-5 text-slate-600">{action.hint}</p>
        </div>
        {!isActive ? (
          <Link
            className="role-welcome-dismiss tap-scale shrink-0 rounded-xl px-3.5 py-2 text-sm font-black shadow-sm"
            href={action.href}
          >
            {action.cta}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
