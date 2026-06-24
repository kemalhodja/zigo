# QA coverage map (manual → automated)

Maps `docs/manual-qa-checklist.md` items to automation. Run automated suites first; finish release with manual-only rows.

| Status | Meaning |
| --- | --- |
| **auto** | Covered by CI or live scripts |
| **partial** | Smoke/route/login only; full UX still manual |
| **manual** | Human verification required |

## Accounts

| Checklist item | Status | Automation |
| --- | --- | --- |
| Register student/parent/teacher | manual | Real signup + email flow |
| Onboarding + area selection | partial | `e2e/auth.spec.ts`, `test:journey` (demo seed) |
| Admin verify teacher + assign areas | manual | `/admin` UI |
| `/api/interests` 403 for teacher self-assign | auto | `test:e2e`, `test:rls` |

## Core social

| Checklist item | Status | Automation |
| --- | --- | --- |
| Teacher create post/micro/spark | partial | `e2e/qa-checklist.spec.ts` (create page), `test:journey` |
| Student/parent Match-Feed visibility | auto | `test:e2e`, `test:live:matrix`, `cross-role-matrix` |
| Like/save/comment + moderation pending | auto | `test:e2e`, `manual-student-journey.mjs` |
| Follow/unfollow | auto | `test:e2e` |
| Collections | partial | `e2e/qa-checklist.spec.ts` |

## Learning & gamification

| Checklist item | Status | Automation |
| --- | --- | --- |
| Pomodoro `/focus` | partial | `e2e/qa-checklist.spec.ts`, journey |
| Micro watch + points | auto | `manual-student-journey.mjs` |
| Quiz `/learn` | auto | journey + `e2e/auth.spec.ts` |
| Safe duels (no DM) | partial | `e2e/qa-checklist.spec.ts` |
| Student hub `/student` | partial | `e2e/qa-checklist.spec.ts` |
| Parent `/family`, child focus | partial | `e2e/auth.spec.ts`, journey |
| Store daily mission | auto | `manual-student-journey.mjs` |
| Legal footer links | auto | `e2e/legal.spec.ts` |
| Zigo Plus dev bypass | manual | Billing UI |
| Stripe checkout return | manual | Stripe test mode |

## Safety & admin

| Checklist item | Status | Automation |
| --- | --- | --- |
| No student DM | auto | `e2e/qa-checklist.spec.ts` (no `/messages` route) |
| Reports + moderation queues | manual | Admin UI |
| Rate limits | auto | `test:unit` (`rate-limit.test.ts`) |
| Audit log on moderation | auto | `test:live`, manual teacher journey |
| Admin verify/assign/rewards | manual | `/admin` |

## Mobile / PWA

| Checklist item | Status | Automation |
| --- | --- | --- |
| `manifest.json` + icons | auto | `e2e/qa-checklist.spec.ts`, `test:mobile` |
| `/offline.html` | auto | `e2e/pwa.spec.ts` |
| Offline fallback in browser | manual | DevTools network |
| APK `CAPACITOR_SERVER_URL` | auto | `test:mobile`, `android:preflight` |
| Safe areas | partial | `e2e/mobile.spec.ts`, visual probe |

## Visual regression (`docs/visual-regression-checklist.md`)

| Area | Status | Automation |
| --- | --- | --- |
| Loading skeletons (home/explore/profile/micro) | auto | `scripts/visual-regression-probe.mjs` |
| Follow button, legal footer, state cards | auto | visual probe + smoke |
| Layout polish (Micro viewport, story progress) | manual | Visual checklist before demo/APK |

## Release commands

```bash
npm run test:release          # repo + coverage + visual probe (+ live if ZIGO_RUN_LIVE_TESTS=1)
npm run test:repo             # CI gate (offline)
ZIGO_RUN_LIVE_TESTS=1 npm run test:live:all   # full live stack
```

Sign-off: `docs/final-acceptance-checklist.md`
