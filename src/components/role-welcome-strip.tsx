"use client";

import { useEffect, useState } from "react";

import type { ViewerRole } from "@/lib/domain/role-theme";
import { useMessages } from "@/lib/i18n/locale-context";

function storageKey(role: ViewerRole) {
  return `zigo:role-welcome-seen:${role}`;
}

export function RoleWelcomeStrip({ viewerRole }: { viewerRole: ViewerRole }) {
  const m = useMessages().roleWelcome;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (viewerRole === "guest") {
      setVisible(false);
      return;
    }

    try {
      setVisible(window.localStorage.getItem(storageKey(viewerRole)) !== "1");
    } catch {
      setVisible(true);
    }
  }, [viewerRole]);

  if (!visible || viewerRole === "guest") {
    return null;
  }

  const copy =
    viewerRole === "student"
      ? { title: m.studentTitle, hint: m.studentHint }
      : viewerRole === "parent"
        ? { title: m.parentTitle, hint: m.parentHint }
        : { title: m.teacherTitle, hint: m.teacherHint };

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey(viewerRole), "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  return (
    <section
      className="role-welcome-strip mb-3 rounded-2xl border px-4 py-3"
      data-testid="role-welcome-strip"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-black leading-snug text-night">{copy.title}</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{copy.hint}</p>
        </div>
        <button
          className="role-welcome-dismiss tap-scale shrink-0 rounded-xl px-3 py-2 text-sm font-black"
          onClick={dismiss}
          type="button"
        >
          {m.gotIt}
        </button>
      </div>
    </section>
  );
}
