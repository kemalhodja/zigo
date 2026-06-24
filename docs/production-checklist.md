# Zigo production launch checklist

Use this after local gates pass (`npm run test:repo`) and migrations **001–055** are applied on Supabase Cloud.

## 1. Supabase Cloud

- [ ] Create production project (EU region recommended for KVKK)
- [ ] Run `supabase/zigo-full-migrations.sql` in SQL Editor (or `npm run migrations:cloud`)
- [ ] Confirm `/api/setup/health` reports `migrationTarget: 55`
- [ ] Enable email auth + set site URL and redirect URLs (`/auth/callback`, `/auth/verify-email`)
- [ ] Create `social-media` storage bucket (public read if using direct URLs)
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` only on server (Vercel env, never client)
- [ ] Seed demo accounts only in staging — not production

## 2. Vercel deploy

- [ ] Copy `.env.staging.example` → production env in Vercel
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_*`, `RECAPTCHA_*` secrets
- [ ] Deploy: `npm run build:safe` passes locally first
- [ ] Post-deploy: open `/setup` and complete hosted deploy card steps
- [ ] Run `npm run staging:preflight` against production URL
- [ ] Run `npm run audit:production` and `npm run uptime:probe` against hosted URL

## 3. Stripe billing

- [ ] Create Stripe products/prices for Zigo Plus
- [ ] Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs in env
- [ ] Register webhook: `https://<domain>/api/billing/webhook`
- [ ] Run `npm run test:stripe-webhook` with staging secret
- [ ] Test checkout → `/billing/success` → subscription reflected in app

## 4. Video CDN (optional but recommended)

- [ ] Set `NEXT_PUBLIC_VIDEO_CDN_BASE` to CDN origin for micro lesson MP4s
- [ ] Verify `npm run test:video-delivery` passes
- [ ] Confirm `/micro` playback uses CDN URL when env is set

## 5. Auth & compliance gates

- [ ] `ZIGO_REQUIRE_EMAIL_VERIFICATION=true` in production
- [ ] `ZIGO_REQUIRE_STUDENT_DOCUMENT=true` for student registrations
- [ ] `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` + `RECAPTCHA_SECRET_KEY` on sign-up
- [ ] Lawyer review of `/legal/privacy`, `/legal/terms`, `/legal/kvkk`, `/legal/delete-account`
- [ ] Complete Play Console using `docs/google-play-console-tr.md` (TR) and `docs/google-play-data-safety.md`

## 6. Mobile / PWA

- [ ] Verify `public/manifest.json` and service worker on production domain
- [ ] Set `CAPACITOR_SERVER_URL` before `npm run android:sync`
- [ ] Run through `docs/mobile-apk-checklist.md`
- [ ] Play Store internal testing track (AAB from `npm run android:build:release`)

## 7. Smoke verification (production)

- [ ] Student: sign in → onboarding → Match-Feed → micro video → quiz
- [ ] Parent: `/family` child profile → quiz activity timeline → reward approval
- [ ] Teacher: verified post in assigned area only → question answer
- [ ] Moderation: blocked keyword returns 422 `MODERATION_BLOCKED`
- [ ] Admin: teacher verification + student document review

## 8. Monitoring (post-launch)

- [ ] Uptime probe on `GET /api/setup/health` (`npm run uptime:probe` or external monitor)
- [ ] Optional: `SENTRY_DSN` for error tracking (see `docs/production-readiness.md`)
- [ ] Supabase logs: auth errors, RLS violations
- [ ] Vercel analytics + error tracking
- [ ] Stripe dashboard: failed webhooks
- [ ] Weekly: `npm run test:journey` against staging clone

---

**Quick commands**

```bash
npm run test:repo          # CI-equivalent local gate (includes Playwright + audit:all)
npm run test:repo:fast     # Same without browser E2E
npm run audit:production   # monitoring + production readiness wiring
npm run uptime:probe       # health endpoint (set ZIGO_HEALTH_URL for hosted)
npm run migrations:bundle  # refresh full SQL bundle
npm run staging:preflight  # hosted env validation
npm run test:unit          # vitest domain tests
```
