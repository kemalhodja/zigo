# Zigo Manual QA Checklist

Use this checklist with a real Supabase project after migrations **001–044** are applied.

**Automation map:** see [`docs/qa-coverage-map.md`](./qa-coverage-map.md) for which items are covered by Playwright, journey scripts, or live probes vs manual-only.

**Release gate:** `npm run test:release` (add `ZIGO_RUN_LIVE_TESTS=1` when Docker Supabase + app server are running).

## Accounts

- Register one student from `/auth`.
- Register one parent from `/auth`.
- Register one teacher from `/auth`.
- Complete `/onboarding` for student and parent; teacher can remain in verification pending until admin review.
- Select at least one shared education area for student and parent.
- Add the first admin to `platform_admins`.
- Verify the teacher from `/admin`.
- Assign the teacher at least one education area from `/admin`.
- Confirm `/api/interests` returns 403 for teacher self-assignment.

## Core Social Flow

- Verified teacher can create a post from `/create`.
- Verified teacher can create Micro from `/create?mode=micro`.
- Verified teacher can create a Spark from `/create?mode=spark` only after choosing an assigned area.
- Student can see only matched posts and Sparks in `/`.
- Parent can see only matched posts and Sparks in `/`.
- Student and parent can like, save and comment on matched posts.
- Student comments show pending moderation before public display.
- Follow/unfollow works from feed, Micro and explore creator surfaces.
- Saved posts appear in `/collections` Smart Collections.

## Learning And Gamification

## Focus-Gamification (Study-with-me)

- Student can start a 25-minute Pomodoro from `/focus`.
- Student can watch a Micro lesson and claim points only after the required watch gate.
- Student can complete a 25-minute focus Pomodoro from `/focus` and earn +15 points.
- Student can share a completed focus session as a Study-with-me moment on the matched feed.
- Student can submit a matched mini quiz from `/learn` and see correct/review result explanation.
- Student can open `/duels` and play only safe topic duels with no messaging.
- Student can see streak, league and level progress from `/student`.
- Parent can create a child profile from `/family`.
- Parent can assign child Match-Feed areas.
- Parent can start supervised child Pomodoro from `/family` and points credit the child profile.
- Parent sees per-child focus stats on `/parent` (sessions and weekly minutes).
- Student can cheer Study-with-me moments from `/focus`.
- Visiting `/store` once per day completes the visit-store daily mission.
- Legal footer links open `/legal/privacy`, `/legal/terms`, `/legal/kvkk`.
- Local demo can activate Zigo Plus from `/focus` or `/parent` when billing dev bypass is enabled.
- Stripe checkout returns to `/billing/success` when configured.

## Safety And Admin

- Student direct messaging is not available anywhere.
- Reports can be submitted from post options.
- Report status appears in `/moderation` and `/moderation/reports/[id]`.
- Creator/admin moderation queues separate comments, Spark replies and reports.
- Comment and Spark reply spam attempts return rate-limit feedback.
- Moderation approve/reject actions create audit log rows.
- Admin can verify/revoke teacher status.
- Admin can assign teacher education areas.
- Admin can manage reward status and stock.

## Mobile/PWA

- `/manifest.json` loads and includes standard, maskable and Apple icons.
- Offline page loads from `/offline.html`.
- Turn network offline in browser devtools and confirm navigation falls back to the offline page.
- Turn network back online and confirm Home/Micro/Profile reload with fresh content, not stale cached HTML.
- APK uses a real `CAPACITOR_SERVER_URL`, not localhost.
- Generated Android config does not contain `localhost`.
- `npm run android:preflight` passes before Android Studio.
- Micro, profile, explore and create surfaces respect mobile safe areas.
