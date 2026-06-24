import { getMessages } from "@/lib/i18n";

/** Zigo product language — user-facing names (not Instagram/Meta feature trademarks). */
export const ZIGO_PATHS = {
  micro: "/micro",
  sparks: "/sparks",
  explore: "/explore",
} as const;

const m = getMessages();

export const ZIGO_LABELS = {
  micro: m.zigo.micro,
  microLesson: m.zigo.microLesson,
  microLessons: m.zigo.microLessons,
  sparks: m.zigo.sparks,
  spark: m.zigo.spark,
  discover: m.zigo.discover,
  watchMicro: m.zigo.micro,
  earnFromMicro: m.zigo.micro,
  createMicro: m.zigo.micro,
  createSpark: m.zigo.spark,
  postSpark: m.zigo.spark,
  studyWithMe: m.zigo.studyWithMe,
  focusMode: m.zigo.focusMode,
  pomodoro: m.zigo.pomodoro,
  startFocus: m.zigo.startFocus,
} as const;
