import {
  DAYS_OF_WEEK,
  type AgendaAlertSummary,
  type DayOfWeek,
  type ExamItem,
  type HomeworkItem,
  type ScheduleLesson,
} from "./types";

/**
 * Sınavın bitip bitmediğini kontrol eder.
 * Sınav saati + sınav süresi (varsayılan 40 dk) geçmişse sınav bitmiştir.
 */
export function isExamFinished(exam: ExamItem, now: Date = new Date()): boolean {
  const examStart = new Date(exam.examDate).getTime();
  if (isNaN(examStart)) return false;
  const durationMs = (exam.durationMinutes ?? 40) * 60 * 1000;
  const examEnd = examStart + durationMs;
  return examEnd <= now.getTime();
}

/**
 * Biten sınavları listeden filtreler (otomatik silinme kuralı).
 */
export function filterActiveExams(exams: ExamItem[], now: Date = new Date()): ExamItem[] {
  return exams.filter((exam) => !isExamFinished(exam, now));
}

/**
 * Ödevin bitiş tarihinin geçip geçmediğini kontrol eder.
 */
export function isHomeworkExpired(homework: HomeworkItem, now: Date = new Date()): boolean {
  const due = new Date(homework.dueDate).getTime();
  if (isNaN(due)) return false;
  return due <= now.getTime();
}

/**
 * Bitiş tarihi geçmiş ödevleri listeden filtreler (otomatik silinme kuralı).
 */
export function filterActiveHomeworks(homeworks: HomeworkItem[], now: Date = new Date()): HomeworkItem[] {
  return homeworks.filter((hw) => !isHomeworkExpired(hw, now));
}

/**
 * Bugünün haftanın hangi günü olduğunu döner (1: Pazartesi ... 7: Pazar).
 */
export function getTodayDayOfWeek(now: Date = new Date()): DayOfWeek {
  const jsDay = now.getDay(); // 0: Pazar, 1: Pazartesi ... 6: Cumartesi
  return jsDay === 0 ? 7 : (jsDay as DayOfWeek);
}

/**
 * Yarının haftanın hangi günü olduğunu döner (1: Pazartesi ... 7: Pazar).
 */
export function getTomorrowDayOfWeek(now: Date = new Date()): DayOfWeek {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getTodayDayOfWeek(tomorrow);
}

/**
 * Yarınki ders programını filtreler ve başlangıç saatine göre sıralar.
 */
export function getTomorrowLessons(lessons: ScheduleLesson[], now: Date = new Date()): ScheduleLesson[] {
  const tomorrowDay = getTomorrowDayOfWeek(now);
  return lessons
    .filter((lesson) => lesson.dayOfWeek === tomorrowDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/**
 * Belirli bir güne ait dersleri saat sırasına göre döner.
 */
export function getLessonsForDay(lessons: ScheduleLesson[], dayOfWeek: DayOfWeek): ScheduleLesson[] {
  return lessons
    .filter((lesson) => lesson.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/**
 * Yaklaşan sınavları hesaplar (örn. önümüzdeki 48 saat içindeki sınavlar).
 */
export function getUpcomingExams(
  exams: ExamItem[],
  now: Date = new Date(),
  windowHours = 48,
) {
  const activeExams = filterActiveExams(exams, now);
  const nowMs = now.getTime();

  return activeExams
    .map((exam) => {
      const examMs = new Date(exam.examDate).getTime();
      const hoursLeft = Math.max(0, Math.round((examMs - nowMs) / (1000 * 60 * 60)));
      const examDate = new Date(exam.examDate);

      const isToday =
        examDate.getDate() === now.getDate() &&
        examDate.getMonth() === now.getMonth() &&
        examDate.getFullYear() === now.getFullYear();

      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow =
        examDate.getDate() === tomorrow.getDate() &&
        examDate.getMonth() === tomorrow.getMonth() &&
        examDate.getFullYear() === tomorrow.getFullYear();

      return {
        ...exam,
        hoursLeft,
        isToday,
        isTomorrow,
      };
    })
    .filter((e) => e.hoursLeft <= windowHours)
    .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
}

/**
 * Bekleyen ve süresi yaklaşan ödevleri döner.
 */
export function getPendingHomeworkAlerts(
  homeworks: HomeworkItem[],
  now: Date = new Date(),
) {
  const active = filterActiveHomeworks(homeworks, now);
  const nowMs = now.getTime();

  return active
    .filter((hw) => !hw.isCompleted)
    .map((hw) => {
      const dueMs = new Date(hw.dueDate).getTime();
      const hoursLeft = Math.max(0, Math.round((dueMs - nowMs) / (1000 * 60 * 60)));
      return {
        ...hw,
        hoursLeft,
        isUrgent: hoursLeft <= 24,
      };
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

/**
 * Ana sayfa ve bildirim ekranları için özet alarm verisi oluşturur.
 */
export function buildAgendaAlertSummary(
  lessons: ScheduleLesson[],
  exams: ExamItem[],
  homeworks: HomeworkItem[],
  now: Date = new Date(),
): AgendaAlertSummary {
  const tomorrowDay = getTomorrowDayOfWeek(now);
  const dayInfo = DAYS_OF_WEEK.find((d) => d.value === tomorrowDay);

  return {
    tomorrowDayName: dayInfo ? dayInfo.label : "Yarın",
    tomorrowLessons: getTomorrowLessons(lessons, now),
    upcomingExams: getUpcomingExams(exams, now, 48),
    pendingHomeworks: getPendingHomeworkAlerts(homeworks, now),
  };
}

export type LiveClassStatus = {
  currentLesson: ScheduleLesson | null;
  minutesLeftInCurrent: number;
  nextLesson: ScheduleLesson | null;
  minutesUntilNext: number;
  isBreak: boolean;
};

/**
 * Güncel saat ve dakikaya göre şu anki dersi ve sıradaki dersi hesaplar.
 */
export function getCurrentAndNextClass(
  lessons: ScheduleLesson[],
  now: Date = new Date(),
): LiveClassStatus {
  const todayDay = getTodayDayOfWeek(now);
  const todayLessons = getLessonsForDay(lessons, todayDay);

  if (todayLessons.length === 0) {
    return {
      currentLesson: null,
      minutesLeftInCurrent: 0,
      nextLesson: null,
      minutesUntilNext: 0,
      isBreak: false,
    };
  }

  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTotalMinutes = currentHours * 60 + currentMinutes;

  let currentLesson: ScheduleLesson | null = null;
  let minutesLeftInCurrent = 0;
  let nextLesson: ScheduleLesson | null = null;
  let minutesUntilNext = 0;

  for (const lesson of todayLessons) {
    const [startH, startM] = lesson.startTime.split(":").map(Number);
    const [endH, endM] = lesson.endTime.split(":").map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (currentTotalMinutes >= startTotal && currentTotalMinutes <= endTotal) {
      currentLesson = lesson;
      minutesLeftInCurrent = Math.max(0, endTotal - currentTotalMinutes);
    } else if (startTotal > currentTotalMinutes) {
      if (!nextLesson) {
        nextLesson = lesson;
        minutesUntilNext = Math.max(0, startTotal - currentTotalMinutes);
      }
    }
  }

  const isBreak = !currentLesson && Boolean(nextLesson);

  return {
    currentLesson,
    minutesLeftInCurrent,
    nextLesson,
    minutesUntilNext,
    isBreak,
  };
}

/**
 * Resmi LGS ve YKS Sınav Şablonları (Milli Eğitim Bakanlığı & ÖSYM Takvimi)
 */
export function getNationalExamTemplates(): Omit<ExamItem, "id">[] {
  return [
    {
      subject: "LGS - Liseye Geçiş Sınavı",
      examDate: "2027-06-13T09:30:00",
      topics: "Türkçe, Matematik, Fen Bilimleri, İnkılap Tarihi, Din Kültürü, Yabancı Dil",
      durationMinutes: 155,
    },
    {
      subject: "YKS - TYT (Temel Yeterlilik Testi)",
      examDate: "2027-06-19T10:15:00",
      topics: "Türkçe (40), Matematik (40), Fen Bilimleri (20), Sosyal Bilimler (20)",
      durationMinutes: 165,
    },
    {
      subject: "YKS - AYT (Alan Yeterlilik Testi)",
      examDate: "2027-06-20T10:15:00",
      topics: "Matematik, Fizik, Kimya, Biyoloji, Edebiyat, Tarih, Coğrafya",
      durationMinutes: 180,
    },
  ];
}

/**
 * Standart Ortaokul ve Lise Haftalık Müfredat Şablonu
 */
export function getCurriculumTemplate(level: "ortaokul" | "lise"): Omit<ScheduleLesson, "id">[] {
  if (level === "ortaokul") {
    return [
      // Pazartesi
      { dayOfWeek: 1, subject: "Türkçe", startTime: "09:00", endTime: "09:40", classroom: "Derslik 1" },
      { dayOfWeek: 1, subject: "Türkçe", startTime: "09:55", endTime: "10:35", classroom: "Derslik 1" },
      { dayOfWeek: 1, subject: "Matematik", startTime: "10:50", endTime: "11:30", classroom: "Derslik 1" },
      { dayOfWeek: 1, subject: "Fen Bilimleri", startTime: "11:45", endTime: "12:25", classroom: "Laboratuvar" },
      // Salı
      { dayOfWeek: 2, subject: "Matematik", startTime: "09:00", endTime: "09:40", classroom: "Derslik 1" },
      { dayOfWeek: 2, subject: "İngilizce", startTime: "09:55", endTime: "10:35", classroom: "Derslik 1" },
      { dayOfWeek: 2, subject: "Sosyal Bilgiler", startTime: "10:50", endTime: "11:30", classroom: "Derslik 1" },
      { dayOfWeek: 2, subject: "Bilişim Teknolojileri", startTime: "11:45", endTime: "12:25", classroom: "Bilgisayar Labı" },
      // Çarşamba
      { dayOfWeek: 3, subject: "Fen Bilimleri", startTime: "09:00", endTime: "09:40", classroom: "Laboratuvar" },
      { dayOfWeek: 3, subject: "Fen Bilimleri", startTime: "09:55", endTime: "10:35", classroom: "Laboratuvar" },
      { dayOfWeek: 3, subject: "Türkçe", startTime: "10:50", endTime: "11:30", classroom: "Derslik 1" },
      { dayOfWeek: 3, subject: "Müzik", startTime: "11:45", endTime: "12:25", classroom: "Müzik Sınıfı" },
      // Perşembe
      { dayOfWeek: 4, subject: "Matematik", startTime: "09:00", endTime: "09:40", classroom: "Derslik 1" },
      { dayOfWeek: 4, subject: "Din Kültürü", startTime: "09:55", endTime: "10:35", classroom: "Derslik 1" },
      { dayOfWeek: 4, subject: "İngilizce", startTime: "10:50", endTime: "11:30", classroom: "Derslik 1" },
      { dayOfWeek: 4, subject: "Beden Eğitimi", startTime: "11:45", endTime: "12:25", classroom: "Spor Salonu" },
      // Cuma
      { dayOfWeek: 5, subject: "Türkçe", startTime: "09:00", endTime: "09:40", classroom: "Derslik 1" },
      { dayOfWeek: 5, subject: "Sosyal Bilgiler", startTime: "09:55", endTime: "10:35", classroom: "Derslik 1" },
      { dayOfWeek: 5, subject: "Görsel Sanatlar", startTime: "10:50", endTime: "11:30", classroom: "Resim Atölyesi" },
      { dayOfWeek: 5, subject: "Rehberlik & Kariyer", startTime: "11:45", endTime: "12:25", classroom: "Derslik 1" },
    ];
  }

  // Lise
  return [
    // Pazartesi
    { dayOfWeek: 1, subject: "Matematik", startTime: "08:30", endTime: "09:10", classroom: "11-A" },
    { dayOfWeek: 1, subject: "Matematik", startTime: "09:25", endTime: "10:05", classroom: "11-A" },
    { dayOfWeek: 1, subject: "Fizik", startTime: "10:20", endTime: "11:00", classroom: "Fizik Labı" },
    { dayOfWeek: 1, subject: "Türk Dili ve Edebiyatı", startTime: "11:15", endTime: "11:55", classroom: "11-A" },
    // Salı
    { dayOfWeek: 2, subject: "Kimya", startTime: "08:30", endTime: "09:10", classroom: "Kimya Labı" },
    { dayOfWeek: 2, subject: "Biyoloji", startTime: "09:25", endTime: "10:05", classroom: "Biyoloji Labı" },
    { dayOfWeek: 2, subject: "İngilizce", startTime: "10:20", endTime: "11:00", classroom: "11-A" },
    { dayOfWeek: 2, subject: "Tarih", startTime: "11:15", endTime: "11:55", classroom: "11-A" },
    // Çarşamba
    { dayOfWeek: 3, subject: "Geometri", startTime: "08:30", endTime: "09:10", classroom: "11-A" },
    { dayOfWeek: 3, subject: "Türk Dili ve Edebiyatı", startTime: "09:25", endTime: "10:05", classroom: "11-A" },
    { dayOfWeek: 3, subject: "Felsefe", startTime: "10:20", endTime: "11:00", classroom: "11-A" },
    { dayOfWeek: 3, subject: "Coğrafya", startTime: "11:15", endTime: "11:55", classroom: "11-A" },
    // Perşembe
    { dayOfWeek: 4, subject: "Matematik", startTime: "08:30", endTime: "09:10", classroom: "11-A" },
    { dayOfWeek: 4, subject: "Fizik", startTime: "09:25", endTime: "10:05", classroom: "Fizik Labı" },
    { dayOfWeek: 4, subject: "Almanca / İkinci Yabancı Dil", startTime: "10:20", endTime: "11:00", classroom: "11-A" },
    { dayOfWeek: 4, subject: "Beden Eğitimi", startTime: "11:15", endTime: "11:55", classroom: "Spor Salonu" },
    // Cuma
    { dayOfWeek: 5, subject: "Kimya", startTime: "08:30", endTime: "09:10", classroom: "Kimya Labı" },
    { dayOfWeek: 5, subject: "Biyoloji", startTime: "09:25", endTime: "10:05", classroom: "Biyoloji Labı" },
    { dayOfWeek: 5, subject: "Din Kültürü", startTime: "10:20", endTime: "11:00", classroom: "11-A" },
    { dayOfWeek: 5, subject: "Seçmeli Proje Hazırlama", startTime: "11:15", endTime: "11:55", classroom: "11-A" },
  ];
}

