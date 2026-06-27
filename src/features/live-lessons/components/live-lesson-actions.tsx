"use client";

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
