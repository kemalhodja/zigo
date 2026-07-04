# Content safety pipeline

Zigo student-visible text passes through layered moderation before display.

## Layers

1. **Keyword gate** — `src/lib/domain/moderation-keywords.ts` (`KEYWORD_LIST_VERSION`) synced with `blocked_keywords` seeds in migration `040`.
2. **Regex suspicious patterns** — spam repetition, off-platform contact hints (`needsReview`, not auto-block).
3. **Optional AI provider** — `ZIGO_AI_MODERATION_URL`; supports `{ safe, needsReview }` verdicts.
4. **Publish status** — `moderateTextForPublish()` sets `moderation_status` to `pending` when the author is a student, keywords flag review, or AI requests review.
5. **Human queue** — teachers/platform admins approve via `/api/social/moderation` and `/moderation`.
6. **Reports SLA** — `content_reports.status`: `open` → `reviewing` → `resolved` / `dismissed` via `PATCH /api/social/reports`.

## Student-visible write paths

These domain modules must call `assertSafeStudentTextAsync` or `moderateTextForPublish`:

| Module | Function |
|--------|----------|
| `social/interactions.ts` | comments, story replies, posts, stories |
| `questions/mutations.ts` | questions, answers |
| `feed/mutations.ts` | legacy posts |
| `learning/quiz.ts` | quiz content |
| `study-moments.ts` | focus captions |

Parent/teacher optional fields (bio, store notes) use sync `assertModeratedOptionalText`.

## Audits

```bash
npm run audit:moderation
```

Runs keyword sync check, pipeline grep audit, and production wiring check.

## AI provider contract

POST `{ text, locale: "tr" }` → `{ safe: boolean, needsReview?: boolean, reason?: string }`

- `safe: false` → request rejected (422).
- `safe: true, needsReview: true` → stored as `pending` even for teachers/parents.

## Report workflow

| Status | Meaning |
|--------|---------|
| `open` | New report |
| `reviewing` | Moderator assigned / in progress |
| `resolved` | Action taken |
| `dismissed` | No violation found |

Post authors and platform admins may transition status (RLS migration `043`).
