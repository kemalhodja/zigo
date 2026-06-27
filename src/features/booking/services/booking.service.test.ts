import { describe, expect, it } from "vitest";

import { assertNoBookingTimeConflict } from "@/features/booking/services/booking.service";

describe("assertNoBookingTimeConflict", () => {
  it("returns false when candidate end is before start", () => {
    const ok = assertNoBookingTimeConflict([], {
      startTime: "2026-06-24T14:00:00.000Z",
      endTime: "2026-06-24T13:00:00.000Z",
    });
    expect(ok).toBe(false);
  });

  it("detects overlapping booked slots", () => {
    const ok = assertNoBookingTimeConflict(
      [
        {
          start_time: "2026-06-24T13:00:00.000Z",
          end_time: "2026-06-24T14:00:00.000Z",
          status: "booked",
        },
      ],
      {
        startTime: "2026-06-24T13:30:00.000Z",
        endTime: "2026-06-24T14:30:00.000Z",
      },
    );
    expect(ok).toBe(false);
  });

  it("ignores cancelled bookings", () => {
    const ok = assertNoBookingTimeConflict(
      [
        {
          start_time: "2026-06-24T13:00:00.000Z",
          end_time: "2026-06-24T14:00:00.000Z",
          status: "cancelled",
        },
      ],
      {
        startTime: "2026-06-24T13:30:00.000Z",
        endTime: "2026-06-24T14:30:00.000Z",
      },
    );
    expect(ok).toBe(true);
  });

  it("allows adjacent non-overlapping slots", () => {
    const ok = assertNoBookingTimeConflict(
      [
        {
          start_time: "2026-06-24T13:00:00.000Z",
          end_time: "2026-06-24T14:00:00.000Z",
          status: "booked",
        },
      ],
      {
        startTime: "2026-06-24T14:00:00.000Z",
        endTime: "2026-06-24T15:00:00.000Z",
      },
    );
    expect(ok).toBe(true);
  });
});
