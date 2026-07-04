# Moderation keyword changelog

Track `KEYWORD_LIST_VERSION` in `src/lib/domain/moderation-keywords.ts` alongside DB seeds in `040_moderation_keyword_filter.sql`.

## 1.0.0 (2026-06-17)

Initial shared list between app and PostgreSQL `blocked_keywords`:

- Profanity: salak, aptal, gerizekali, mal, küfür, siktir, bok, orospu, piç, …
- Bullying: ezik, zorbalık, dalga geç, dışla
- Self-harm: kendini öldür, geber, ölsen iyi
- Personal info: adresim, telefonum, okulum, evim
- Off-platform: whatsapp, telegram, snap, discord, mesaj at, özelden

Suspicious patterns (review queue, not block): character repetition, standalone `dm`.

When adding terms:

1. Append to `BLOCKED_KEYWORD_TERMS` and `BLOCKED_KEYWORD_CATEGORIES`.
2. Add matching `insert into blocked_keywords` in a new migration (or admin UI when live).
3. Bump `KEYWORD_LIST_VERSION` and record the change here.
4. Run `npm run audit:moderation`.
