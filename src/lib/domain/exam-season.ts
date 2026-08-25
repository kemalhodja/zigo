/**
 * Exam season hub (#9): Turkey's national exam calendar + weekly league types.
 *
 * Dates follow the historical pattern:
 *  - LGS: mid-June (second Sunday window)
 *  - YKS: third weekend of June (TYT Saturday, AYT Sunday)
 * Config is per-year so countdowns stay accurate without code churn.
 */

export type ExamDef = {
  key: "lgs" | "yks";
  name: string;
  shortName: string;
  /** ISO date (UTC) of the first session. */
  date: string;
  audience: string;
};

export const EXAM_CALENDAR: Record<number, ExamDef[]> = {
  2026: [
    { key: "lgs", name: "Liseye Geçiş Sınavı", shortName: "LGS", date: "2026-06-14", audience: "8. sınıf" },
    { key: "yks", name: "Yükseköğretim Kurumları Sınavı", shortName: "YKS", date: "2026-06-20", audience: "12. sınıf / mezun" },
  ],
  2027: [
    { key: "lgs", name: "Liseye Geçiş Sınavı", shortName: "LGS", date: "2027-06-13", audience: "8. sınıf" },
    { key: "yks", name: "Yükseköğretim Kurumları Sınavı", shortName: "YKS", date: "2027-06-19", audience: "12. sınıf / mezun" },
  ],
  2028: [
    { key: "lgs", name: "Liseye Geçiş Sınavı", shortName: "LGS", date: "2028-06-11", audience: "8. sınıf" },
    { key: "yks", name: "Yükseköğretim Kurumları Sınavı", shortName: "YKS", date: "2028-06-17", audience: "12. sınıf / mezun" },
  ],
};

export type UpcomingExam = ExamDef & {
  daysRemaining: number;
  year: number;
};

/** Returns the next upcoming exam strictly after `now`, or null if none configured. */
export function getNextExams(now: Date = new Date(), count = 2): UpcomingExam[] {
  const all: UpcomingExam[] = [];
  for (const [yearKey, exams] of Object.entries(EXAM_CALENDAR)) {
    const year = Number(yearKey);
    for (const exam of exams) {
      const examDate = new Date(`${exam.date}T09:00:00Z`); // sessions start morning local
      const daysRemaining = Math.ceil((examDate.getTime() - now.getTime()) / 86_400_000);
      if (daysRemaining > 0) {
        all.push({ ...exam, daysRemaining, year });
      }
    }
  }
  all.sort((a, b) => a.daysRemaining - b.daysRemaining);
  return all.slice(0, count);
}

export function formatDaysRemaining(daysRemaining: number): string {
  if (daysRemaining === 1) return "son gün!";
  return `${daysRemaining} gün`;
}

/** Motivational phase based on time left — drives copy tone on the hub. */
export function seasonPhase(daysRemaining: number): {
  label: string;
  tip: string;
} {
  if (daysRemaining <= 30) {
    return {
      label: "Final Sprint",
      tip: "Deneme sınavı haftası: her gün bir deneme + yanlış tekrarları.",
    };
  }
  if (daysRemaining <= 100) {
    return {
      label: "Yoğun Tempo",
      tip: "Eksik konuları kapatma dönemi — günde en az 2 odak bloğu.",
    };
  }
  return {
    label: "Temel Dönem",
    tip: "Şimdi kurduğun rutin, son 100 günün motorudur. Streak'i kırma!",
  };
}
