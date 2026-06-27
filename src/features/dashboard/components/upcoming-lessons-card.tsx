import {
  CalendarAgendaCard,
  CalendarAgendaView,
} from "@/features/booking/components/calendar-agenda-view";
import { LiveLessonActions } from "@/features/live-lessons/components/live-lesson-actions";
import type { UpcomingLessonItem } from "@/features/dashboard/services/development-dashboard.service";

type UpcomingLessonsCardProps = {
  lessons: UpcomingLessonItem[];
  labels: {
    title: string;
    empty: string;
    withTeacher: string;
    agendaLabel?: string;
    joinLesson: string;
    startLesson: string;
    notYet: string;
    completed: string;
  };
};

export function UpcomingLessonsCard({ lessons, labels }: UpcomingLessonsCardProps) {
  if (lessons.length === 0) {
    return <p className="mt-3 text-base font-semibold text-slate-500">{labels.empty}</p>;
  }

  return (
    <CalendarAgendaView label={labels.agendaLabel}>
      {lessons.map((lesson) => (
        <CalendarAgendaCard
          actions={
            <LiveLessonActions
              endTime={lesson.endTime}
              labels={{
                joinLesson: labels.joinLesson,
                startLesson: labels.startLesson,
                notYet: labels.notYet,
                completed: labels.completed,
              }}
              meetingUrl={lesson.meetingUrl}
              role="parent"
              startTime={lesson.startTime}
              status={lesson.status}
            />
          }
          badge={
            <span className="inline-flex rounded-xl bg-violet-50 px-3 py-1 text-sm font-black text-violet-700">
              {labels.withTeacher.replace("{teacher}", lesson.teacherName)}
            </span>
          }
          key={lesson.id}
          subtitle={lesson.childName ?? undefined}
          title={formatLessonWindow(lesson.startTime, lesson.endTime)}
        />
      ))}
    </CalendarAgendaView>
  );
}

function formatLessonWindow(startTime: string, endTime: string) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const date = start.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  const startLabel = start.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const endLabel = end.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${startLabel} – ${endLabel}`;
}
