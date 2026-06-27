export type LiveLessonRow = {
  id: string;
  booking_id: string;
  teacher_id: string;
  parent_id: string;
  meeting_url: string;
  provider: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: "scheduled" | "live" | "completed" | "canceled";
};

export function buildJitsiMeetingUrl(bookingId: string, baseUrl = process.env.JITSI_BASE_URL ?? "https://meet.jit.si") {
  const roomName = `zigo-${bookingId.replace(/-/g, "")}`;
  return `${baseUrl.replace(/\/$/, "")}/${roomName}`;
}

export function isLiveLessonJoinWindow(startTime: string, endTime: string, now = Date.now()) {
  const start = new Date(startTime).getTime() - 15 * 60 * 1000;
  const end = new Date(endTime).getTime() + 15 * 60 * 1000;
  return now >= start && now <= end;
}
