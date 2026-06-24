# Zigo launch checklist

Apply migrations **001–044** on Supabase before any public demo.

See `docs/production-readiness.md` for rollback, backup drill, and monitoring cadence.

## Pre-launch

- [ ] `npm run test:repo` passes locally.
- [ ] `npm run audit:production` passes.
- [ ] `npm run staging:preflight` passes with hosted `NEXT_PUBLIC_SITE_URL`.
- [ ] `node scripts/manual-student-journey.mjs` passes against local or staging Supabase.
- [ ] `npm run test:acceptance` reports **100/100**.
- [ ] Legal pages reachable: `/legal/privacy`, `/legal/terms`, `/legal/kvkk`, `/legal/delete-account`.
- [ ] Stripe env set for production OR dev billing bypass disabled in prod.
- [ ] `NEXT_PUBLIC_SITE_URL` matches deployed domain (billing success/cancel URLs).

## Product gates

- [ ] Verified teachers post only in assigned `user_interests` areas.
- [ ] Student/parent Match-Feed shows only matched posts.
- [ ] Focus Pomodoro awards points; Study-with-me share respects area match.
- [ ] Parent child focus from `/family` credits `child_profiles.total_points`.
- [ ] Zigo Plus unlocks study plans (`402` without Plus on `/api/learning/study-plan`).
- [ ] Store visit mission records once per day from `/store`.

## Mobile / PWA

- [ ] `npm run test:mobile` and `npm run android:preflight` before APK handoff.
- [ ] LAN test on phone: `http://<LAN-IP>:3001` with local Supabase.

## Post-launch monitoring

- Moderation queue latency and report SLA.
- Stripe webhook delivery (subscription sync).
- Supabase connection pool and storage usage.

See also `docs/manual-qa-checklist.md` and `docs/video-delivery.md`.
