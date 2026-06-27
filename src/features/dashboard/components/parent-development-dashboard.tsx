import { DevelopmentGrowthChart } from "@/features/dashboard/components/development-growth-chart";
import { TopicSuccessChart } from "@/features/dashboard/components/topic-success-chart";
import { UpcomingLessonsCard } from "@/features/dashboard/components/upcoming-lessons-card";
import type { ParentDevelopmentDashboardData } from "@/features/dashboard/services/development-dashboard.service";

type ParentDevelopmentDashboardProps = {
  data: ParentDevelopmentDashboardData;
  labels: {
    eyebrow: string;
    title: string;
    weekly: {
      eyebrow: string;
      title: string;
      reports: string;
      average: string;
      topArea: string;
      bookings: string;
      empty: string;
    };
    topicSuccess: {
      title: string;
      empty: string;
      successLabel: string;
    };
    growth: {
      title: string;
      empty: string;
      scoreLabel: string;
    };
    upcoming: {
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
};

export function ParentDevelopmentDashboard({ data, labels }: ParentDevelopmentDashboardProps) {
  const weekly = data.weeklyProgress;
  const hasWeeklyData =
    weekly.reportCount > 0 || weekly.completedBookings > 0 || weekly.averageScore > 0;

  return (
    <section className="-mx-4 space-y-4 bg-gradient-to-br from-violet-50 via-white to-cyan-50 px-4 py-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{labels.eyebrow}</p>
        <h2 className="mt-2 text-xl font-black text-night">{labels.title}</h2>
      </div>

      <div className="rounded-2xl bg-white zigo-mobile-card shadow-sm ring-1 ring-violet-100">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{labels.weekly.eyebrow}</p>
        <h3 className="mt-2 text-lg font-black text-night">{labels.weekly.title}</h3>
        {!hasWeeklyData ? (
          <p className="mt-3 text-sm font-semibold text-slate-500">{labels.weekly.empty}</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Stat label={labels.weekly.reports} value={String(weekly.reportCount)} />
            <Stat label={labels.weekly.average} value={`${weekly.averageScore}`} />
            <Stat label={labels.weekly.topArea} value={weekly.topArea ?? "—"} />
            <Stat label={labels.weekly.bookings} value={String(weekly.completedBookings)} />
          </div>
        )}
      </div>

      <div className="grid gap-4">
        <div className="rounded-2xl bg-white zigo-mobile-card shadow-sm ring-1 ring-cyan-100">
          <p className="text-sm font-black text-night">{labels.topicSuccess.title}</p>
          <TopicSuccessChart data={data.topicSuccess} labels={labels.topicSuccess} />
        </div>

        <div className="rounded-2xl bg-white zigo-mobile-card shadow-sm ring-1 ring-violet-100">
          <p className="text-sm font-black text-night">{labels.growth.title}</p>
          <DevelopmentGrowthChart data={data.growthCurve} labels={labels.growth} />
        </div>

        <div className="rounded-2xl bg-white zigo-mobile-card shadow-sm ring-1 ring-pink-100">
          <p className="text-sm font-black text-night">{labels.upcoming.title}</p>
          <UpcomingLessonsCard lessons={data.upcomingLessons} labels={labels.upcoming} />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-violet-50 px-3 py-3 ring-1 ring-violet-100">
      <p className="text-lg font-black text-night">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}
