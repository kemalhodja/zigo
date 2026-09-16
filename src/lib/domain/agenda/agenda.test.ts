import { describe, expect, it } from "vitest";
import {
  buildAgendaAlertSummary,
  filterActiveExams,
  filterActiveHomeworks,
  getCurriculumTemplate,
  getCurrentAndNextClass,
  getNationalExamTemplates,
  getTomorrowDayOfWeek,
  getTomorrowLessons,
  getUpcomingExams,
  isExamFinished,
  isHomeworkExpired,
} from "./service";
import type { ExamItem, HomeworkItem, ScheduleLesson } from "./types";

describe("Agenda Domain Business Rules", () => {
  it("automatically identifies and filters finished exams (isExamFinished & filterActiveExams)", () => {
    const baseNow = new Date("2026-09-16T12:00:00Z");

    // Sınav 1 saat önce bitmiş (09:00 - 09:40)
    const pastExam: ExamItem = {
      id: "ex-past",
      subject: "Fizik 1. Yazılı",
      examDate: "2026-09-16T09:00:00Z",
      durationMinutes: 40,
    };

    // Sınav şu anda devam ediyor (11:50 - 12:30)
    const ongoingExam: ExamItem = {
      id: "ex-ongoing",
      subject: "Kimya 1. Yazılı",
      examDate: "2026-09-16T11:50:00Z",
      durationMinutes: 40,
    };

    // Sınav yarın yapılacak
    const futureExam: ExamItem = {
      id: "ex-future",
      subject: "Biyoloji 1. Yazılı",
      examDate: "2026-09-17T10:00:00Z",
      durationMinutes: 40,
    };

    expect(isExamFinished(pastExam, baseNow)).toBe(true);
    expect(isExamFinished(ongoingExam, baseNow)).toBe(false);
    expect(isExamFinished(futureExam, baseNow)).toBe(false);

    const activeList = filterActiveExams([pastExam, ongoingExam, futureExam], baseNow);
    expect(activeList).toHaveLength(2);
    expect(activeList.map((e) => e.id)).toEqual(["ex-ongoing", "ex-future"]);
  });

  it("automatically identifies and filters expired homeworks (isHomeworkExpired & filterActiveHomeworks)", () => {
    const baseNow = new Date("2026-09-16T12:00:00Z");

    // Bitiş tarihi geçmiş ödev
    const pastHomework: HomeworkItem = {
      id: "hw-past",
      subject: "Matematik",
      title: "Logaritma Alıştırmaları",
      dueDate: "2026-09-15T23:59:00Z",
      isCompleted: false,
    };

    // Bitiş tarihi henüz gelmemiş ödev
    const futureHomework: HomeworkItem = {
      id: "hw-future",
      subject: "Türkçe",
      title: "Paragraf Denemesi",
      dueDate: "2026-09-18T18:00:00Z",
      isCompleted: false,
    };

    expect(isHomeworkExpired(pastHomework, baseNow)).toBe(true);
    expect(isHomeworkExpired(futureHomework, baseNow)).toBe(false);

    const activeHomeworks = filterActiveHomeworks([pastHomework, futureHomework], baseNow);
    expect(activeHomeworks).toHaveLength(1);
    expect(activeHomeworks[0].id).toBe("hw-future");
  });

  it("correctly identifies tomorrow's day of week and returns tomorrow's lessons sorted by start time", () => {
    // 2026-09-16 is a Wednesday (JS day = 3). Tomorrow is Thursday (JS day = 4, DayOfWeek = 4).
    const wednesday = new Date("2026-09-16T10:00:00Z");
    expect(getTomorrowDayOfWeek(wednesday)).toBe(4);

    const lessons: ScheduleLesson[] = [
      { id: "l1", dayOfWeek: 4, subject: "Tarih", startTime: "10:30", endTime: "11:10" },
      { id: "l2", dayOfWeek: 3, subject: "Matematik", startTime: "09:00", endTime: "09:40" },
      { id: "l3", dayOfWeek: 4, subject: "İngilizce", startTime: "09:00", endTime: "09:40" },
      { id: "l4", dayOfWeek: 5, subject: "Müzik", startTime: "14:00", endTime: "14:40" },
    ];

    const tomorrowLessons = getTomorrowLessons(lessons, wednesday);
    expect(tomorrowLessons).toHaveLength(2);
    expect(tomorrowLessons[0].subject).toBe("İngilizce"); // 09:00
    expect(tomorrowLessons[1].subject).toBe("Tarih"); // 10:30
  });

  it("generates upcoming exam alerts within 48 hours with tomorrow and today flags", () => {
    const baseNow = new Date("2026-09-16T12:00:00Z");

    const exams: ExamItem[] = [
      {
        id: "ex-1",
        subject: "Matematik",
        examDate: "2026-09-17T09:00:00Z", // ~21 hours later (tomorrow)
        durationMinutes: 40,
      },
      {
        id: "ex-2",
        subject: "Fizik",
        examDate: "2026-09-25T09:00:00Z", // ~9 days later (outside 48h)
        durationMinutes: 40,
      },
    ];

    const upcoming = getUpcomingExams(exams, baseNow, 48);
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0].id).toBe("ex-1");
    expect(upcoming[0].isTomorrow).toBe(true);
  });

  it("builds a complete alert summary for home feed reminders", () => {
    const wednesday = new Date("2026-09-16T10:00:00Z");

    const lessons: ScheduleLesson[] = [
      { id: "l1", dayOfWeek: 4, subject: "Geometri", startTime: "09:00", endTime: "09:40" },
    ];

    const exams: ExamItem[] = [
      { id: "ex-1", subject: "Türkçe Yazılısı", examDate: "2026-09-17T11:00:00Z", durationMinutes: 40 },
    ];

    const homeworks: HomeworkItem[] = [
      { id: "hw-1", subject: "Biyoloji", title: "Bitki Hücresi Çizimi", dueDate: "2026-09-17T18:00:00Z", isCompleted: false },
    ];

    const summary = buildAgendaAlertSummary(lessons, exams, homeworks, wednesday);
    expect(summary.tomorrowDayName).toBe("Perşembe");
    expect(summary.tomorrowLessons).toHaveLength(1);
    expect(summary.upcomingExams).toHaveLength(1);
    expect(summary.pendingHomeworks).toHaveLength(1);
  });

  it("calculates live current and next class status accurately", () => {
    // Wednesday 2026-09-16 (dayOfWeek = 3)
    const lessons: ScheduleLesson[] = [
      { id: "l1", dayOfWeek: 3, subject: "Matematik", startTime: "09:00", endTime: "09:40" },
      { id: "l2", dayOfWeek: 3, subject: "Türkçe", startTime: "09:55", endTime: "10:35" },
    ];

    // Scenario 1: Currently inside class (09:20)
    const insideClass = new Date("2026-09-16T09:20:00");
    const status1 = getCurrentAndNextClass(lessons, insideClass);
    expect(status1.currentLesson?.subject).toBe("Matematik");
    expect(status1.minutesLeftInCurrent).toBe(20);
    expect(status1.nextLesson?.subject).toBe("Türkçe");
    expect(status1.isBreak).toBe(false);

    // Scenario 2: In break (09:45)
    const inBreak = new Date("2026-09-16T09:45:00");
    const status2 = getCurrentAndNextClass(lessons, inBreak);
    expect(status2.currentLesson).toBeNull();
    expect(status2.isBreak).toBe(true);
    expect(status2.nextLesson?.subject).toBe("Türkçe");
    expect(status2.minutesUntilNext).toBe(10);
  });

  it("provides valid national exam and curriculum templates", () => {
    const nationalExams = getNationalExamTemplates();
    expect(nationalExams.length).toBeGreaterThanOrEqual(2);
    expect(nationalExams.some((e) => e.subject.includes("LGS"))).toBe(true);
    expect(nationalExams.some((e) => e.subject.includes("YKS"))).toBe(true);

    const ortaokul = getCurriculumTemplate("ortaokul");
    const lise = getCurriculumTemplate("lise");
    expect(ortaokul.length).toBe(20);
    expect(lise.length).toBe(20);
  });
});
