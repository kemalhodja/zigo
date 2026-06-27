"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  CalendarAgendaCard,
  CalendarAgendaEmpty,
  CalendarAgendaView,
} from "@/features/booking/components/calendar-agenda-view";
import { useTeacherAvailability } from "@/features/booking/hooks";
import type { TeacherAvailabilitySlot } from "@/features/booking/types";
import { useMessages } from "@/lib/i18n/locale-context";

type TeacherSlotSelectorProps = {
  labels: {
    title: string;
    desc: string;
    start: string;
    end: string;
    add: string;
    empty: string;
    booked: string;
    open: string;
  };
  initialSlots: TeacherAvailabilitySlot[];
};

export function TeacherSlotSelector({ labels, initialSlots }: TeacherSlotSelectorProps) {
  const router = useRouter();
  const m = useMessages();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { slots, createSlot, deleteSlot, isMutating } = useTeacherAvailability({ initialSlots });

  async function addSlot() {
    setError(null);
    try {
      await createSlot({
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });
      setStartTime("");
      setEndTime("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Slot could not be created.");
    }
  }

  async function removeSlot(slotId: string) {
    setError(null);
    try {
      await deleteSlot(slotId);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Slot could not be removed.");
    }
  }

  return (
    <section className="-mx-4 border-y border-violet-100 bg-white px-4 py-4">
      <p className="zigo-eyebrow text-crystal">{labels.title}</p>
      <p className="mt-2 text-base leading-6 text-slate-600">{labels.desc}</p>
      <div className="zigo-dashboard-grid mt-4">
        <label className="block text-sm font-bold text-slate-500">
          {labels.start}
          <input
            className="zigo-input mt-2 w-full rounded-xl px-4 py-3 font-semibold text-night"
            onChange={(event) => setStartTime(event.target.value)}
            type="datetime-local"
            value={startTime}
          />
        </label>
        <label className="block text-sm font-bold text-slate-500">
          {labels.end}
          <input
            className="zigo-input mt-2 w-full rounded-xl px-4 py-3 font-semibold text-night"
            onChange={(event) => setEndTime(event.target.value)}
            type="datetime-local"
            value={endTime}
          />
        </label>
      </div>
      <button
        className="zigo-touch-btn tap-scale mt-4 w-full rounded-2xl bg-gradient-to-r from-crystal to-berry text-white disabled:opacity-60"
        disabled={isMutating || !startTime || !endTime}
        onClick={() => void addSlot()}
        type="button"
      >
        {labels.add}
      </button>
      {error ? <p className="mt-2 text-base font-semibold text-rose-600">{error}</p> : null}

      {slots.length === 0 ? (
        <CalendarAgendaEmpty>{labels.empty}</CalendarAgendaEmpty>
      ) : (
        <CalendarAgendaView label={m.ecosystem.agendaViewLabel}>
          {slots.map((slot) => (
            <CalendarAgendaCard
              actions={
                !slot.is_booked ? (
                  <button
                    className="zigo-touch-btn rounded-xl bg-rose-50 px-4 text-rose-700 disabled:opacity-60"
                    disabled={isMutating}
                    onClick={() => void removeSlot(slot.id)}
                    type="button"
                  >
                    {m.ecosystem.slotRemove}
                  </button>
                ) : undefined
              }
              badge={
                <span
                  className={`inline-flex rounded-xl px-3 py-1 text-sm font-black ${
                    slot.is_booked ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {slot.is_booked ? labels.booked : labels.open}
                </span>
              }
              key={slot.id}
              subtitle={new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(slot.end_time))}
              title={new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
                new Date(slot.start_time),
              )}
            />
          ))}
        </CalendarAgendaView>
      )}
    </section>
  );
}
