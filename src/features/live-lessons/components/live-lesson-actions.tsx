"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { isLiveLessonJoinWindow } from "@/lib/domain/live-lessons/types";

type LiveLessonActionsProps = {
  meetingUrl: string | null | undefined;
  startTime: string;
  endTime: string;
  status: "booked" | "completed" | "cancelled" | "scheduled" | "live" | "completed" | "canceled";
  role: "parent" | "teacher";
  labels: {
    joinLesson: string;
    startLesson: string;
    notYet: string;
    completed: string;
  };
};

export function LiveLessonActions({
  meetingUrl,
  startTime,
  endTime,
  status,
  role,
  labels,
}: LiveLessonActionsProps) {
  const isBooked = status === "booked" || status === "scheduled" || status === "live";
  const canJoin = Boolean(meetingUrl) && isBooked && isLiveLessonJoinWindow(startTime, endTime);
  const label = role === "teacher" ? labels.startLesson : labels.joinLesson;

  if (status === "completed" || status === "cancelled" || status === "canceled") {
    return <p className="text-sm font-semibold text-slate-500">{labels.completed}</p>;
  }

  if (!meetingUrl) {
    return <p className="text-sm font-semibold text-slate-500">{labels.notYet}</p>;
  }

  if (!canJoin) {
    return <p className="text-sm font-semibold text-slate-500">{labels.notYet}</p>;
  }

  return (
    <a
      className="zigo-touch-btn inline-flex rounded-xl bg-gradient-to-r from-crystal to-berry px-4 text-white"
      href={meetingUrl}
      rel="noopener noreferrer"
      target="_blank"
    >
      {label}
    </a>
  );
}

type LessonPackageGateProps = {
  hasAccess: boolean;
  labels: {
    expired: string;
    renew: string;
  };
  children: React.ReactNode;
};

export function LessonPackageGate({ hasAccess, labels, children }: LessonPackageGateProps) {
  if (hasAccess) return <>{children}</>;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-base font-black text-amber-900">{labels.expired}</p>
      <p className="mt-2 text-sm font-semibold text-amber-800">{labels.renew}</p>
      <Link className="zigo-mobile-cta tap-scale mt-4 inline-flex rounded-2xl px-5 py-3" href="/parent/packages">
        {labels.renew}
      </Link>
    </div>
  );
}
