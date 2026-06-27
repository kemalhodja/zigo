"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useBookings, useUpdateBookingStatus } from "@/features/booking/hooks";
import { LiveLessonActions } from "@/features/live-lessons/components/live-lesson-actions";

type TeacherBookingsPanelProps = {
  labels: {
    title: string;
    desc: string;
    empty: string;
    complete: string;
    cancel: string;
    completed: string;
    cancelled: string;
    statusBooked: string;
    statusCompleted: string;
    statusCancelled: string;
    startLesson: string;
    joinLesson: string;
    notYet: string;
    lessonCompleted: string;
  };
};

export function TeacherBookingsPanel({ labels }: TeacherBookingsPanelProps) {
  const router = useRouter();
  const { bookings, loading } = useBookings();
  const updateBookingMutation = useUpdateBookingStatus({
    onSuccess: () => router.refresh(),
  });
  const [message, setMessage] = useState("");

  async function patchBooking(bookingId: string, status: "completed" | "cancelled") {
    setMessage("");
    try {
      await updateBookingMutation.mutateAsync({ bookingId, status });
      setMessage(status === "completed" ? labels.completed : labels.cancelled);
      if (status === "completed") {
        window.dispatchEvent(new Event("zigo:notification-changed"));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : labels.empty);
    }
  }

  return (
    <section className="-mx-4 border-y border-emerald-100 bg-white px-4 py-4">
      <h3 className="text-lg font-black text-night">{labels.title}</h3>
      <p className="mt-1 text-sm text-slate-600">{labels.desc}</p>
      {message ? <p className="mt-2 text-sm font-bold text-crystal">{message}</p> : null}
      <div className="mt-3 space-y-2">
        {loading ? (
          <p className="text-sm text-slate-500">…</p>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-slate-500">{labels.empty}</p>
        ) : (
          bookings.map((booking) => {
            const liveLesson = Array.isArray(booking.live_lessons)
              ? booking.live_lessons[0]
              : booking.live_lessons;

            return (
            <article className="zigo-mobile-card rounded-2xl border border-slate-100 bg-slate-50" key={booking.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-night">{booking.parent?.full_name ?? "Veli"}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
                      new Date(booking.start_time),
                    )}
                  </p>
                </div>
                <span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-slate-600">
                  {booking.status === "booked"
                    ? labels.statusBooked
                    : booking.status === "completed"
                      ? labels.statusCompleted
                      : labels.statusCancelled}
                </span>
              </div>
              <div className="mt-3">
                <LiveLessonActions
                  endTime={booking.end_time}
                  labels={{
                    joinLesson: labels.joinLesson,
                    startLesson: labels.startLesson,
                    notYet: labels.notYet,
                    completed: labels.lessonCompleted,
                  }}
                  meetingUrl={liveLesson?.meeting_url}
                  role="teacher"
                  startTime={booking.start_time}
                  status={booking.status}
                />
              </div>
              {booking.status === "booked" ? (
                <div className="mt-3 flex gap-2">
                  <button
                    className="zigo-touch-btn rounded-xl bg-emerald-600 px-4 text-white disabled:opacity-60"
                    disabled={updateBookingMutation.isPending && updateBookingMutation.variables?.bookingId === booking.id}
                    onClick={() => void patchBooking(booking.id, "completed")}
                    type="button"
                  >
                    {labels.complete}
                  </button>
                  <button
                    className="zigo-touch-btn rounded-xl bg-slate-300 px-4 text-night disabled:opacity-60"
                    disabled={updateBookingMutation.isPending && updateBookingMutation.variables?.bookingId === booking.id}
                    onClick={() => void patchBooking(booking.id, "cancelled")}
                    type="button"
                  >
                    {labels.cancel}
                  </button>
                </div>
              ) : null}
            </article>
            );
          })
        )}
      </div>
    </section>
  );
}
