# Zigo Final Acceptance Checklist

Run this chain before demo, hosted launch, or Android handoff.

## 0. Automated release gate

```bash
npm run audit:launch
npm run test:release
```

See `docs/final-launch.md` for hosted sequence and CI parity (`npm run test:ci`).

With local Supabase + server:

```powershell
$env:ZIGO_RUN_LIVE_TESTS="1"
$env:E2E_BASE_URL="http://localhost:3005"
npm run test:release
```

Full platform scorecard: `npm run setup:complete` (`test:all`).

## Sign-off

| Gate | Owner | Date | Pass |
| --- | --- | --- | --- |
| Hosted launch (`audit:launch` + staging preflight) | Engineering | | ☐ |
| Repository (`test:release`) | Engineering | | ☐ |
| Live Supabase (`test:live:all`) | Engineering | | ☐ |
| Manual QA (`docs/manual-qa-checklist.md`) | QA | | ☐ |
| Visual regression (`docs/visual-regression-checklist.md`) | Design/QA | | ☐ |
| Mobile/APK (`docs/mobile-apk-checklist.md`) | Mobile | | ☐ |
| Legal review (`/legal/*`) | Legal | | ☐ |

Bug reports: use GitHub **Bug Report** template (role, `area_id`, expected RLS).

Coverage map: `docs/qa-coverage-map.md`

## 1. Repository Gate

- `npm run test:smoke`
- `npm run test:migrations`
- `npm run test:rls`
- `npm run test:live`
- `npm run test:deploy`
- `npm run test:mobile`
- `npm run typecheck`
- `npm run build:safe`

## 2. Live Supabase Gate

- Environment variables are set for the hosted app.
- `SUPABASE_SERVICE_ROLE_KEY` is configured on the server for automated live gate checks.
- `npm run test:live` passes against the target project.
- `/setup` and `/readiness` show green live gates for schema, storage, admin and audit log.
- Supabase Auth redirect includes `/auth/callback`.
- Migrations `001` through `024` are applied in order.
- `social-media` storage bucket and upload policies exist.
- First admin exists in `platform_admins`.
- Moderation audit log is created when comments or story replies are approved/rejected.

## 3. Role Gate

- Student signs up, chooses interests, sees only matched posts and stories.
- Parent signs up, chooses interests, creates child profile and approves rewards.
- Teacher signs up, waits for admin verification, receives assigned areas and publishes only there.
- Platform admin verifies teachers, assigns teacher areas, moderates queues and manages rewards.

## 4. Visual Gate

- Home, Reels, Explore, Profile and Create feel media-first and mobile-first.
- Education/gamification text stays secondary to the social shell.
- Empty, signed-out, no-interest and offline states show one clear next action.
- `docs/safe-instagram-feel-checklist.md` passes: Zigo branding is visible, Instagram trademarks/assets are absent, and the app reads as an education-first social platform.

## 5. Mobile Gate

- Hosted URL works on real phone browser.
- `npm run android:preflight` passes.
- Generated Android config does not include `localhost`.
- Debug APK or release AAB opens the hosted Zigo app.
