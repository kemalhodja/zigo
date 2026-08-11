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
