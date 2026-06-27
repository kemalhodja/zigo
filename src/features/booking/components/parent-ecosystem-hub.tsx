"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useBookings, useCancelBooking, useCreateBooking, useTeacherOpenSlots } from "@/features/booking/hooks";
import {
  CalendarAgendaCard,
  CalendarAgendaEmpty,
  CalendarAgendaView,
} from "@/features/booking/components/calendar-agenda-view";
import type { LessonBookingListItem } from "@/features/booking/types";
import { useMessages } from "@/lib/i18n/locale-context";

type ChildOption = { id: string; name: string };
type AreaOption = { id: number; name: string };
type MatchedTeacher = {
  teacher_id: string;
  full_name: string;
  reputation_score: number;
  area_name: string;
  match_score: number;
};

type ParentEcosystemHubProps = {
  childrenOptions: ChildOption[];
  areaOptions: AreaOption[];
  labels: {
    eyebrow: string;
    matchingTitle: string;
    matchingDesc: string;
    weakness: string;
    findTeachers: string;
    noMatches: string;
    bookTitle: string;
    bookDesc: string;
    chooseTeacher: string;
    chooseChild: string;
    loadSlots: string;
    noOpenSlots: string;
    bookSlot: string;
    bookingDone: string;
    saveNeed: string;
    reputation: string;
    areaLabel: string;
    myBookingsTitle: string;
    myBookingsDesc: string;
    bookingsEmpty: string;
    cancelBooking: string;
    cancelBookingConfirm: string;
    bookingCancelled: string;
    statusBooked: string;
    statusCompleted: string;
    statusCancelled: string;
  };
};

export function ParentEcosystemHub({ childrenOptions, areaOptions, labels }: ParentEcosystemHubProps) {
  const router = useRouter();
  const m = useMessages();
  const [childProfileId, setChildProfileId] = useState(childrenOptions[0]?.id ?? "");
  const [weaknessLevel, setWeaknessLevel] = useState(3);
  const [areaId, setAreaId] = useState("");
  const [matches, setMatches] = useState<MatchedTeacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [slotsTeacherId, setSlotsTeacherId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const { slots, loading: slotsLoading, refresh: refreshOpenSlots } = useTeacherOpenSlots(slotsTeacherId);

  const loadSlots = useCallback(
    async (showBusy = true) => {
      if (!selectedTeacherId) return;
      if (showBusy) setBusy(true);
      setMessage("");
      try {
        if (slotsTeacherId === selectedTeacherId) {
          await refreshOpenSlots();
        } else {
          setSlotsTeacherId(selectedTeacherId);
        }
      } catch (error) {
        if (showBusy) setMessage(error instanceof Error ? error.message : labels.noOpenSlots);
      } finally {
        if (showBusy) setBusy(false);
      }
    },
    [labels.noOpenSlots, refreshOpenSlots, selectedTeacherId, slotsTeacherId],
  );

  useEffect(() => {
    setSlotsTeacherId(null);
  }, [selectedTeacherId]);

  const { bookings, loading: bookingsLoading } = useBookings();
  const cancelBookingMutation = useCancelBooking({
    onSuccess: async () => {
      await loadSlots(false);
      router.refresh();
    },
  });
  const createBookingMutation = useCreateBooking({
    onSuccess: () => router.refresh(),
  });

  useEffect(() => {
    if (!childProfileId && childrenOptions[0]?.id) {
      setChildProfileId(childrenOptions[0].id);
    }
    if (!areaId && areaOptions[0]?.id) {
      setAreaId(String(areaOptions[0].id));
    }
  }, [areaId, areaOptions, childProfileId, childrenOptions]);

  async function saveNeedAndMatch() {
    if (!childProfileId || !areaId) return;
    setBusy(true);
    setMessage("");
    try {
      const needRes = await fetch("/api/ecosystem/matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childProfileId,
          areaId: Number(areaId),
          weaknessLevel,
        }),
      });
      if (!needRes.ok) {
        const body = (await needRes.json()) as { error?: string };
        throw new Error(body.error ?? labels.saveNeed);
      }

      const matchRes = await fetch(
        `/api/ecosystem/matching?childProfileId=${childProfileId}&limit=5`,
      );
      const matchBody = (await matchRes.json()) as { data?: MatchedTeacher[]; error?: string };
      if (!matchRes.ok) throw new Error(matchBody.error ?? labels.noMatches);
      setMatches(matchBody.data ?? []);
      if (matchBody.data?.[0]) setSelectedTeacherId(matchBody.data[0].teacher_id);
      setMessage(labels.saveNeed);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : labels.noMatches);
    } finally {
      setBusy(false);
    }
  }

  async function bookSlot(slotId: string) {
    setBusy(true);
    setMessage("");
    try {
      await createBookingMutation.mutateAsync({
        slotId,
        childProfileId: childProfileId || undefined,
        areaId: areaId ? Number(areaId) : undefined,
      });
      setMessage(labels.bookingDone);
      if (slotsTeacherId === selectedTeacherId) await refreshOpenSlots();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : labels.noOpenSlots);
    } finally {
      setBusy(false);
    }
  }

  async function cancelBooking(bookingId: string) {
    if (!window.confirm(labels.cancelBookingConfirm)) return;

    setMessage("");
    try {
      await cancelBookingMutation.mutateAsync(bookingId);
      setMessage(labels.bookingCancelled);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : labels.cancelBooking);
    }
  }

  function statusLabel(status: LessonBookingListItem["status"]) {
    if (status === "booked") return labels.statusBooked;
    if (status === "completed") return labels.statusCompleted;
    return labels.statusCancelled;
  }

  return (
    <section className="-mx-4 border-y border-violet-100 bg-gradient-to-br from-violet-50/80 to-white px-4 py-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{labels.eyebrow}</p>

      <div className="mt-4 zigo-mobile-card rounded-2xl border border-violet-100 bg-white">
        <h3 className="text-base font-black text-night">{labels.matchingTitle}</h3>
        <p className="mt-1 text-sm text-slate-600">{labels.matchingDesc}</p>
        <div className="zigo-dashboard-grid mt-3">
          {childrenOptions.length > 0 ? (
            <label className="block text-xs font-bold text-slate-500">
              {labels.chooseChild}
              <select
                className="zigo-input mt-1 w-full rounded-xl px-3 py-2 text-sm font-semibold"
                onChange={(event) => setChildProfileId(event.target.value)}
                value={childProfileId}
              >
                {childrenOptions.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block text-xs font-bold text-slate-500">
            {labels.weakness} ({weaknessLevel}/5)
            <input
              className="mt-2 w-full"
              max={5}
              min={1}
              onChange={(event) => setWeaknessLevel(Number(event.target.value))}
              type="range"
              value={weaknessLevel}
            />
          </label>
          <label className="block text-sm font-bold text-slate-500">
            {labels.areaLabel}
            <select
              className="zigo-input mt-2 w-full rounded-xl px-4 py-3 font-semibold"
              onChange={(event) => setAreaId(event.target.value)}
              value={areaId}
            >
              {areaOptions.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          className="zigo-touch-btn tap-scale mt-4 w-full rounded-2xl bg-gradient-to-r from-crystal to-berry text-white disabled:opacity-60"
          disabled={busy || !childProfileId || !areaId}
          onClick={() => void saveNeedAndMatch()}
          type="button"
        >
          {labels.findTeachers}
        </button>
        {matches.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {matches.map((teacher) => (
              <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2" key={teacher.teacher_id}>
                <div>
                  <p className="text-sm font-black text-night">{teacher.full_name}</p>
                  <p className="text-xs text-slate-500">
                    {teacher.area_name} · {labels.reputation} {teacher.reputation_score}
                  </p>
                </div>
                <button
                  className="text-xs font-black text-crystal"
                  onClick={() => setSelectedTeacherId(teacher.teacher_id)}
                  type="button"
                >
                  {selectedTeacherId === teacher.teacher_id ? "✓" : "→"}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-4 zigo-mobile-card rounded-2xl border border-cyan-100 bg-white">
        <h3 className="text-base font-black text-night">{labels.bookTitle}</h3>
        <p className="mt-1 text-sm text-slate-600">{labels.bookDesc}</p>
        <label className="mt-3 block text-xs font-bold text-slate-500">
          {labels.chooseTeacher}
          <select
            className="zigo-input mt-1 w-full rounded-xl px-3 py-2 text-sm font-semibold"
            onChange={(event) => setSelectedTeacherId(event.target.value)}
            value={selectedTeacherId}
          >
            <option value="">{labels.chooseTeacher}</option>
            {matches.map((teacher) => (
              <option key={teacher.teacher_id} value={teacher.teacher_id}>
                {teacher.full_name} · {teacher.area_name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="zigo-touch-btn tap-scale mt-4 w-full rounded-2xl border border-cyan-200 bg-cyan-50 text-crystal disabled:opacity-60"
          disabled={busy || !selectedTeacherId}
          onClick={() => void loadSlots()}
          type="button"
        >
          {labels.loadSlots}
        </button>
        {slotsLoading ? (
          <p className="mt-3 text-base text-slate-500">…</p>
        ) : !slotsTeacherId || slots.length === 0 ? (
          <CalendarAgendaEmpty>{labels.noOpenSlots}</CalendarAgendaEmpty>
        ) : (
          <CalendarAgendaView label={m.ecosystem.agendaViewLabel}>
            {slots.map((slot) => (
              <CalendarAgendaCard
                actions={
                  <button
                    className="zigo-touch-btn rounded-xl bg-emerald-600 px-4 text-white disabled:opacity-60"
                    disabled={busy}
                    onClick={() => void bookSlot(slot.id)}
                    type="button"
                  >
                    {labels.bookSlot}
                  </button>
                }
                key={slot.id}
                title={new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
                  new Date(slot.start_time),
                )}
              />
            ))}
          </CalendarAgendaView>
        )}
      </div>

      <div className="mt-4 zigo-mobile-card rounded-2xl border border-amber-100 bg-white">
        <h3 className="text-base font-black text-night">{labels.myBookingsTitle}</h3>
        <p className="mt-1 text-sm text-slate-600">{labels.myBookingsDesc}</p>
        <div className="mt-3 space-y-2">
          {bookingsLoading ? (
            <p className="text-sm text-slate-500">…</p>
          ) : bookings.length === 0 ? (
            <p className="text-sm text-slate-500">{labels.bookingsEmpty}</p>
          ) : (
            bookings.map((booking) => (
              <article className="zigo-slot-row zigo-mobile-card rounded-2xl bg-slate-50" key={booking.id}>
                <div className="min-w-0">
                  <p className="text-sm font-black text-night">
                    {booking.teacher?.full_name ?? labels.chooseTeacher}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
                      new Date(booking.start_time),
                    )}
                    {" – "}
                    {new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(booking.end_time))}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-slate-600">
                    {statusLabel(booking.status)}
                  </span>
                  {booking.status === "booked" ? (
                    <button
                      className="zigo-touch-btn rounded-xl bg-rose-500 px-4 text-white disabled:opacity-60"
                      disabled={
                        (cancelBookingMutation.isPending && cancelBookingMutation.variables === booking.id) ||
                        busy
                      }
                      onClick={() => void cancelBooking(booking.id)}
                      type="button"
                    >
                      {cancelBookingMutation.isPending && cancelBookingMutation.variables === booking.id
                        ? "…"
                        : labels.cancelBooking}
                    </button>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {message ? <p className="mt-3 text-sm font-bold text-crystal">{message}</p> : null}
    </section>
  );
}
