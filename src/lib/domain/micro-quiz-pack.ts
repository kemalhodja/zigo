export const MICRO_QUIZ_PACK = {
  id: "micro-quiz",
  microHref: "/create?mode=micro&pack=micro-quiz",
  quizHref: "/teacher?pack=micro-quiz",
  questionCount: 10,
  microSeconds: 60,
} as const;

export function isMicroQuizPack(pack: string | null | undefined) {
  return pack === MICRO_QUIZ_PACK.id;
}

export function resolveCreatePackHref(pack: string | null | undefined) {
  if (!isMicroQuizPack(pack)) return null;
  return {
    micro: MICRO_QUIZ_PACK.microHref,
    quiz: MICRO_QUIZ_PACK.quizHref,
  };
}
