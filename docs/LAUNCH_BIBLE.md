# Zigo production launch checklist

Use this after local gates pass (`npm run test:repo`) and migrations **001–091** are applied on Supabase Cloud.

## 1. Supabase Cloud

- [ ] Create production project (EU region recommended for KVKK)
- [ ] Run `supabase/zigo-full-migrations.sql` in SQL Editor (or `npm run migrations:cloud`)
- [ ] Confirm `/api/setup/health` reports `migrationTarget: 91`
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
# Zigo Production Deployment Checklist & Runbook

This document serves as the mandatory pre-flight checklist, operational runbook, and incident response guide for deploying Zigo to production.

---

## 1. Environment & Secret Verification Checklist

- [ ] **Supabase Credentials**:
  - `NEXT_PUBLIC_SUPABASE_URL`: Connected to live production project.
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Configured properly.
  - `SUPABASE_SERVICE_ROLE_KEY`: Secured in environment secrets (never exposed to client).

- [ ] **Stripe Billing Integration**:
  - `STRIPE_SECRET_KEY`: Production live secret key (`sk_live_...`).
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Live publishable key (`pk_live_...`).
  - `STRIPE_WEBHOOK_SECRET`: Configured from live Stripe Webhook endpoint.

- [ ] **Google Play & In-App Purchases**:
  - `GOOGLE_PLAY_SERVICE_ACCOUNT`: Service account JSON credential stored in production environment variables.
  - Product IDs registered in Play Console: `zigo_plus_monthly`, `zigo_plus_yearly`.

- [ ] **Push & Error Monitoring**:
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` & `VAPID_PRIVATE_KEY`: Configured for WebPush.
  - `SENTRY_DSN`: Configured for production error logging.

---

## 2. Business Logic Verification

1. **No Ads Policy**:
   - Verify zero AdMob / ad-reward SDK calls in production builds.
   - Confirm all monetization flows through Zigo Plus subscriptions and 30-day trials.

2. **30-Day Trial & Dynamic Pricing Engine**:
   - `subscription-campaign.ts`: 50% discount during initial 30 days after signup.
   - 0% discount (full list price) after 30 days.

3. **RBAC & Authorization**:
   - Verify role gates for `STUDENT`, `TEACHER`, `PARENT`, `EDUCATION_INSTITUTION`, `EDUCATION_PLATFORM`, `PUBLISHER`.
   - Block direct student messaging routes (redirecting to `/teacher/lessons`).

---

## 3. Deployment Steps

```bash
# 1. Clean build verification
npm run build:safe

# 2. Run repository audit suite
npm run audit:all

# 3. Mobile Capacitor Sync & Build Verification
npm run android:preflight
npm run android:build:release
```

---

## 4. Incident Response & Rollback Runbook

- **Stripe / Google Play Webhook Failure**:
  1. Inspect error logs in Admin Dashboard or Sentry.
  2. Verify idempotency signatures using `npm run test:deploy`.
  3. Trigger manual sync via `node scripts/auth-scenario-test.mjs`.

- **Database Emergency Rollback**:
  1. Revert to previous schema target using migration bundle.
  2. Execute `npm run migrations:cloud` after verifying backup.
# Zigo Hosted Deploy Checklist

Use this after repository checks pass and before sharing a public URL or syncing Android.

## 0. Staging preflight

```bash
npm run migrations:bundle
# Set hosted NEXT_PUBLIC_SITE_URL in .env.local (not localhost)
npm run staging:preflight
```

Full walkthrough: `docs/staging-deploy.md`

## 1. Pick a host

Recommended: **Vercel** for the Next.js app.

- Import the Zigo repository.
- Framework preset: Next.js.
- Build command: `npm run build` (or `npm run build:safe` if you want a clean `.next` first).
- Output: default Next.js.

## 2. Environment variables

Set these in the hosting dashboard (and in local `.env.local` for parity):

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | Public | `https://your-domain.example` — no trailing slash |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | For `/api/setup/health` and `npm run test:live` |
| `STRIPE_SECRET_KEY` | Server only | Stripe test/live secret |
| `STRIPE_PRICE_ID_ZIGO_PLUS` | Server only | Zigo Plus price id |
| `STRIPE_WEBHOOK_SECRET` | Server only | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_CHECKOUT_ENABLED` | Public | `true` when billing is ready |
| `ZIGO_BILLING_DEV_BYPASS` | Server only | **`false` on hosted staging/prod** |

Never expose `SUPABASE_SERVICE_ROLE_KEY` or Stripe secrets to the browser.

## 3. Supabase database

Run `supabase/zigo-full-migrations.sql` (migrations **001–089**) in the Supabase SQL editor before first deploy.
Confirm `account_deletion_requests`, `export_user_data()`, and `parent_update_store_redemption_status()` exist after apply.

## 4. Supabase Auth redirect URLs

In Supabase → Authentication → URL configuration:

1. **Site URL**: same as `NEXT_PUBLIC_SITE_URL`
2. **Redirect URLs** — add both:
   - `https://your-domain.example/auth/callback`
   - `https://your-domain.example/auth/callback?next=/onboarding`

For local development also keep:

- `http://localhost:3000/auth/callback`
- `http://localhost:3001/auth/callback`
- `http://localhost:3000/auth/callback?next=/onboarding`

## 5. Stripe webhook

In Stripe → Developers → Webhooks:

- Endpoint: `https://your-domain.example/api/billing/webhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copy signing secret to `STRIPE_WEBHOOK_SECRET`

## 6. Verify auth callback

1. Open `/setup` and copy the redirect URLs from **Hosted deploy**.
2. Register a test user from `/auth`.
3. Confirm email (if enabled) lands on `/onboarding` through `/auth/callback`.
4. Sign out and sign in again without errors.

## 7. Post-deploy commands

Run against the hosted project (CI or local with production env):

```bash
npm run audit:launch
npm run test:acceptance
npm run test:smoke
npm run test:rls
npm run test:live
npm run test:deploy
npm run staging:preflight -- --skip-build
npm run uptime:probe
npm run typecheck
```

## 8. Android / Capacitor

Before `npm run android:sync`:

```env
CAPACITOR_SERVER_URL=https://your-domain.example
```

Then run `npm run android:preflight`.

## 9. Manual QA

Open `/readiness` or `/setup` and complete the **Manual role QA** panel for student, parent, teacher and admin accounts.

Also run `docs/manual-qa-checklist.md` and `docs/launch-checklist.md`.
