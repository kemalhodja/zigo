/* global process */

/**
 * Centralized feature flags. All gates live here so a launch day decision is
 * a single-line change (or a Vercel env update) instead of a code hunt.
 *
 * Convention: ZIGO_FLAG_<NAME> env var; "true"/"1" enables, anything else
 * uses the documented default.
 */

function flagEnabled(name: string): boolean {
  const raw = process.env[`ZIGO_FLAG_${name}`]?.trim().toLowerCase();
  return raw === "true" || raw === "1";
}

export const featureFlags = {
  /** Realtime presence-based study rooms (Faz 1). */
  roomsRealtime(): boolean {
    return flagEnabled("ROOMS_REALTIME");
  },
  /** Anonymous preview feed before signup (Faz 1). */
  publicPreviewFeed(): boolean {
    return flagEnabled("PUBLIC_PREVIEW_FEED");
  },
  /** Student-created quiz sharing (Faz 2). */
  quizUgc(): boolean {
    return flagEnabled("QUIZ_UGC");
  },
  /** Spaced repetition review cards from wrong answers (Faz 2). */
  spacedRepetition(): boolean {
    return flagEnabled("SPACED_REPETITION");
  },
  /** Two-pane desktop layout (Faz 1). */
  desktopLayout(): boolean {
    return flagEnabled("DESKTOP_LAYOUT");
  },
} as const;
