# Education core

Verified learning loop: micro videos, quizzes, safe duels, focus Pomodoro, missions, and Zigo points (roadmap §8).

## Verification

```bash
npm run audit:education
npm run audit:product-scope   # Match-Feed + micro/quiz/duel gates (overlapping subset)
```

Included in `audit:all` / `test:repo:fast`.

## Points economy (verified actions only)

| Action | Points | Gate |
| --- | --- | --- |
| Micro / reel watch (60s) | +10 | Verified teacher; `complete_video_post` / reel RPC |
| Quiz complete | +10 | `get_matched_quizzes` area match; one attempt per quiz |
| Safe duel win | +25 | `p_area_id` Match-Feed gate; no DM |
| Focus Pomodoro | configurable | `complete_focus_session`; area + child profile support |
| Store visit mission | tracking only | Once per day from `/store` |

Direct client point awards are disabled (`/api/gamification/award` → 410).

## Match-Feed for learning

Quizzes and feed videos respect the same area invariant as social posts:

- Student: `get_matched_quizzes()` → `current_user_has_area(area_id)`
- Parent child mode: `get_child_matched_quizzes(child_profile_id)`
- Feed videos: `getPersonalizedFeed` → `user_interests`

## Surfaces

| Surface | Route | Domain |
| --- | --- | --- |
| Learn hub | `/learn` | Quizzes, missions, reward path |
| Micro | `/micro` | Short-form lessons + watch rewards |
| Duels | `/duels` | Topic duels, area-scoped wins |
| Focus | `/focus` | Pomodoro start/complete, Study-with-me |
| Study plans | `POST /api/learning/study-plan` | Zigo Plus (402 without subscription) |

## Migrations

| Migration | Scope |
| --- | --- |
| 007 | Quizzes, video completions, learning engine |
| 011 | `learning_events` + reel watch RPC |
| 028 | Duel + quiz learning events |
| 030–031 | Focus sessions, analytics, study plans |
| 032 | Child focus, store visit events |
| 041 | Multi-question quizzes |
| 044 | Verified-teacher video gate, duel `p_area_id` |

## Manual QA

1. Student with shared math area → `/learn` shows matched quiz only.
2. Watch micro video 60s → +10 points once per post.
3. Complete quiz → +10; second attempt blocked.
4. Win duel in assigned area → +25; wrong area rejected.
5. Complete focus block → points + parent visibility on `/family`.
6. Study plan save without Plus → HTTP 402.

## Related

- `docs/product-scope-audit.md` — cross-cutting product gates
- `docs/qa-coverage-map.md` — Playwright learn/focus coverage
- `src/lib/domain/learning/` — schemas, quiz, awards, progress
